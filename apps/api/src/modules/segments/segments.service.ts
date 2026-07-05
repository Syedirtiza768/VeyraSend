import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Segment, Contact, ListMembership, type SegmentDefinition, type SegmentRule } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface SegmentRow {
  id: string;
  name: string;
  definition: SegmentDefinition;
  createdAt: string;
}

export interface SegmentEvalContact {
  id: string;
  email: string;
  status: string;
  firstName?: string | null;
  lastName?: string | null;
  customFields?: Record<string, unknown>;
}

@Injectable()
export class SegmentsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string): Promise<SegmentRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Segment).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      definition: s.definition,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async create(tenantId: string, name: string, definition: SegmentDefinition): Promise<SegmentRow> {
    const tid = assertTenant(tenantId);
    if (!name.trim()) throw new BadRequestException('name is required');
    this.validateDefinition(definition);
    const row = this.ds.getRepository(Segment).create({ tenantId: tid, name: name.trim(), definition });
    await this.ds.getRepository(Segment).save(row);
    return { id: row.id, name: row.name, definition: row.definition, createdAt: row.createdAt.toISOString() };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Segment).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Segment not found in this tenant.');
    await this.ds.getRepository(Segment).delete({ id, tenantId: tid });
  }

  async evaluateById(tenantId: string, id: string): Promise<{ count: number; sample: SegmentEvalContact[] }> {
    const tid = assertTenant(tenantId);
    const seg = await this.ds.getRepository(Segment).findOne({ where: { id, tenantId: tid } });
    if (!seg) throw new NotFoundException('Segment not found in this tenant.');
    const contacts = await this.evaluateContacts(tid, seg.definition);
    return { count: contacts.length, sample: contacts.slice(0, 100) };
  }

  async evaluate(tenantId: string, def: SegmentDefinition): Promise<{ count: number; sample: SegmentEvalContact[] }> {
    const contacts = await this.evaluateContacts(tenantId, def);
    return { count: contacts.length, sample: contacts.slice(0, 100) };
  }

  /** Full matched contact list — used by campaigns to fan out sends. */
  async evaluateContacts(tenantId: string, def: SegmentDefinition): Promise<SegmentEvalContact[]> {
    const tid = assertTenant(tenantId);
    this.validateDefinition(def);

    const contacts = await this.ds.getRepository(Contact).find({ where: { tenantId: tid } });
    const live = contacts.filter((c) => c.deletedAt === null);

    const listCache = new Map<string, Set<string>>();
    for (const rule of def.rules) {
      if (rule.field === 'list' && !listCache.has(rule.value)) {
        const memberships = await this.ds
          .getRepository(ListMembership)
          .find({ where: { tenantId: tid, listId: rule.value }, select: ['contactId'] });
        listCache.set(rule.value, new Set(memberships.map((m) => m.contactId)));
      }
    }

    const matched = live.filter((c) => this.matches(c, def, listCache));
    return matched.map((c) => ({
      id: c.id,
      email: c.email,
      status: c.status,
      firstName: c.firstName,
      lastName: c.lastName,
      customFields: c.customFields,
    }));
  }

  private validateDefinition(def: SegmentDefinition): void {
    if (!def || !Array.isArray(def.rules)) {
      throw new BadRequestException('definition.rules must be an array');
    }
    if (def.combinator !== 'and' && def.combinator !== 'or') {
      throw new BadRequestException('definition.combinator must be "and" or "or"');
    }
    for (const r of def.rules) {
      if (!r.field || typeof r.op !== 'string' || typeof r.value !== 'string') {
        throw new BadRequestException('each rule needs {field, op, value}');
      }
    }
  }

  private matchesRule(c: Contact, rule: SegmentRule, listCache: Map<string, Set<string>>): boolean {
    const v = rule.value;
    switch (rule.field) {
      case 'email':
        return this.applyOp(c.email, rule.op, v);
      case 'status':
        return this.applyOp(c.status, rule.op, v);
      case 'list': {
        const set = listCache.get(v);
        return set ? set.has(c.id) : false;
      }
      default: {
        if (rule.field.startsWith('custom:')) {
          const key = rule.field.slice('custom:'.length);
          const raw = c.customFields?.[key];
          const s = raw === null || raw === undefined ? '' : String(raw);
          return this.applyOp(s, rule.op, v);
        }
        return false;
      }
    }
  }

  private applyOp(actual: string, op: SegmentRule['op'], value: string): boolean {
    const a = actual.toLowerCase();
    const v = value.toLowerCase();
    switch (op) {
      case 'eq':
        return a === v;
      case 'ne':
        return a !== v;
      case 'contains':
        return a.includes(v);
      case 'domain_eq':
        return a.endsWith(`@${v}`);
      default:
        return false;
    }
  }

  private matches(c: Contact, def: SegmentDefinition, listCache: Map<string, Set<string>>): boolean {
    if (def.rules.length === 0) return true;
    return def.combinator === 'and'
      ? def.rules.every((r) => this.matchesRule(c, r, listCache))
      : def.rules.some((r) => this.matchesRule(c, r, listCache));
  }
}
