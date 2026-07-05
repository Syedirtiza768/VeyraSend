import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog, Contact, Conversation, Deal, Message, Note, Task, type ContactStatus, type LifecycleStage } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { CompaniesService } from '../companies/companies.service';
import { TagsService } from '../tags/tags.service';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';

export interface ContactRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  customFields: Record<string, unknown>;
  companyId: string | null;
  ownerUserId: string | null;
  leadSource: string | null;
  lifecycleStage: string;
  phone: string | null;
  createdAt: string;
}

export interface UpsertContactInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  customFields?: Record<string, unknown>;
  companyId?: string | null;
  ownerUserId?: string | null;
  leadSource?: string | null;
  lifecycleStage?: LifecycleStage;
  phone?: string | null;
}

export interface TimelineEntry {
  id: string;
  type: 'audit' | 'note' | 'task' | 'message';
  action: string;
  summary: string;
  createdAt: string;
  detail: Record<string, unknown> | null;
}

function toRow(c: Contact): ContactRow {
  return {
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    status: c.status,
    customFields: c.customFields ?? {},
    companyId: c.companyId,
    ownerUserId: c.ownerUserId,
    leadSource: c.leadSource,
    lifecycleStage: c.lifecycleStage,
    phone: c.phone,
    createdAt: c.createdAt.toISOString(),
  };
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly companies: CompaniesService,
    private readonly tags: TagsService,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  repo() {
    return this.ds.getRepository(Contact);
  }

  async list(tenantId: string, limit = 200): Promise<ContactRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.repo().find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map(toRow);
  }

  async getById(tenantId: string, id: string): Promise<ContactRow> {
    const tid = assertTenant(tenantId);
    const row = await this.repo().findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Contact not found in this tenant.');
    return toRow(row);
  }

  async upsert(tenantId: string, input: UpsertContactInput): Promise<ContactRow> {
    const tid = assertTenant(tenantId);
    const email = input.email.toLowerCase().trim();
    if (!email) throw new BadRequestException('email is required');

    const existing = await this.repo().findOne({ where: { tenantId: tid, email } });
    if (existing) {
      existing.firstName = input.firstName ?? existing.firstName;
      existing.lastName = input.lastName ?? existing.lastName;
      existing.customFields = input.customFields ?? existing.customFields;
      if (input.companyId !== undefined) existing.companyId = input.companyId;
      if (input.ownerUserId !== undefined) existing.ownerUserId = input.ownerUserId;
      if (input.leadSource !== undefined) existing.leadSource = input.leadSource;
      if (input.lifecycleStage !== undefined) existing.lifecycleStage = input.lifecycleStage;
      if (input.phone !== undefined) existing.phone = input.phone;
      existing.deletedAt = null;
      await this.repo().save(existing);
      return toRow(existing);
    }
    const row = this.repo().create({
      tenantId: tid,
      email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      status: 'active' as ContactStatus,
      customFields: input.customFields ?? {},
      companyId: input.companyId ?? null,
      ownerUserId: input.ownerUserId ?? null,
      leadSource: input.leadSource ?? null,
      lifecycleStage: input.lifecycleStage ?? 'lead',
      phone: input.phone ?? null,
    });
    await this.repo().save(row);
    await this.workflows.dispatch(tid, 'contact.created', { contactId: row.id }).catch(() => undefined);
    return toRow(row);
  }

  async setStatusByEmail(tenantId: string, email: string, status: ContactStatus): Promise<void> {
    const tid = assertTenant(tenantId);
    const e = email.toLowerCase().trim();
    const existing = await this.repo().findOne({ where: { tenantId: tid, email: e } });
    if (existing) {
      existing.status = status;
      await this.repo().save(existing);
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.repo().findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Contact not found in this tenant.');
    await this.repo().softDelete({ id, tenantId: tid });
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
        } else field += ch;
        continue;
      }
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else field += ch;
    }
    if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  async importCsv(tenantId: string, csvText: string): Promise<{ imported: number; skipped: number }> {
    const tid = assertTenant(tenantId);
    const rows = this.parseCsv(csvText.trim());
    if (rows.length === 0) throw new BadRequestException('CSV is empty.');

    const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
    const emailIdx = header.findIndex((h) => h === 'email' || h === 'email_address');
    if (emailIdx === -1) throw new BadRequestException('CSV must include an "email" column.');
    const firstIdx = header.findIndex((h) => h === 'first_name' || h === 'firstname');
    const lastIdx = header.findIndex((h) => h === 'last_name' || h === 'lastname');
    const companyIdx = header.findIndex((h) => h === 'company' || h === 'company_name');
    const tagsIdx = header.findIndex((h) => h === 'tags' || h === 'tag');
    const phoneIdx = header.findIndex((h) => h === 'phone');
    const customKeys = header
      .map((h, i) => ({ h, i }))
      .filter(({ h, i }) => i !== emailIdx && i !== firstIdx && i !== lastIdx && i !== companyIdx && i !== tagsIdx && i !== phoneIdx && h !== '');

    let imported = 0;
    let skipped = 0;
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r]!;
      const email = (cells[emailIdx] ?? '').trim().toLowerCase();
      if (!email) { skipped++; continue; }

      const customFields: Record<string, unknown> = {};
      for (const { h, i } of customKeys) customFields[h] = cells[i] ?? '';

      let companyId: string | null = null;
      if (companyIdx >= 0) {
        const companyName = (cells[companyIdx] ?? '').trim();
        if (companyName) {
          const company = await this.companies.findOrCreateByName(tid, companyName);
          companyId = company.id;
        }
      }

      const contact = await this.upsert(tid, {
        email,
        firstName: firstIdx >= 0 ? (cells[firstIdx] ?? '').trim() || null : null,
        lastName: lastIdx >= 0 ? (cells[lastIdx] ?? '').trim() || null : null,
        phone: phoneIdx >= 0 ? (cells[phoneIdx] ?? '').trim() || null : null,
        companyId,
        customFields,
      });

      if (tagsIdx >= 0) {
        const tagNames = (cells[tagsIdx] ?? '').split(',').map((t) => t.trim()).filter(Boolean);
        if (tagNames.length > 0) {
          const tagIds: string[] = [];
          for (const name of tagNames) {
            const tag = await this.tags.findOrCreateByName(tid, name);
            tagIds.push(tag.id);
          }
          await this.tags.attachToContact(tid, contact.id, tagIds);
        }
      }
      imported++;
    }
    return { imported, skipped };
  }

  async exportCsv(tenantId: string): Promise<string> {
    const rows = await this.list(tenantId, 5000);
    const lines = ['email,first_name,last_name,phone,company_id,lifecycle_stage,status'];
    for (const c of rows) {
      lines.push([
        c.email,
        c.firstName ?? '',
        c.lastName ?? '',
        c.phone ?? '',
        c.companyId ?? '',
        c.lifecycleStage,
        c.status,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
    return lines.join('\n');
  }

  async duplicates(tenantId: string): Promise<{ phone: string; contactIds: string[] }[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.query(
      `SELECT phone, array_agg(id) AS contact_ids FROM contacts
       WHERE tenant_id = $1 AND phone IS NOT NULL AND phone != '' AND deleted_at IS NULL
       GROUP BY phone HAVING COUNT(*) > 1`,
      [tid],
    );
    return rows.map((r: { phone: string; contact_ids: string[] }) => ({
      phone: r.phone,
      contactIds: r.contact_ids,
    }));
  }

  async timeline(tenantId: string, contactId: string, limit = 50): Promise<TimelineEntry[]> {
    const tid = assertTenant(tenantId);
    await this.getById(tid, contactId);

    const dealIds = (await this.ds.getRepository(Deal).find({
      where: { tenantId: tid, contactId },
      select: ['id'],
    })).map((d) => d.id);

    const auditQb = this.ds.getRepository(AuditLog).createQueryBuilder('a')
      .where('a.tenantId = :tid', { tid })
      .andWhere(
        '(a.entityType = :contactType AND a.entityId = :contactId)' +
        (dealIds.length ? ' OR (a.entityType = :dealType AND a.entityId IN (:...dealIds))' : ''),
        { contactType: 'contact', contactId, dealType: 'deal', dealIds },
      );

    const audits = await auditQb.orderBy('a.createdAt', 'DESC').take(limit).getMany();
    const notes = await this.ds.getRepository(Note).find({
      where: { tenantId: tid, entityType: 'contact', entityId: contactId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    const tasks = await this.ds.getRepository(Task).find({
      where: { tenantId: tid, entityType: 'contact', entityId: contactId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const conv = await this.ds.getRepository(Conversation).findOne({ where: { tenantId: tid, contactId } });
    const channelMessages = conv
      ? await this.ds.getRepository(Message).find({
          where: { tenantId: tid, conversationId: conv.id },
          order: { createdAt: 'DESC' },
          take: limit,
        })
      : [];

    const entries: TimelineEntry[] = [
      ...audits.map((a) => ({
        id: a.id, type: 'audit' as const, action: a.action,
        summary: a.action, createdAt: a.createdAt.toISOString(), detail: a.detail,
      })),
      ...notes.map((n) => ({
        id: n.id, type: 'note' as const, action: 'note.create',
        summary: n.body.slice(0, 120), createdAt: n.createdAt.toISOString(), detail: null,
      })),
      ...tasks.map((t) => ({
        id: t.id, type: 'task' as const, action: 'task.create',
        summary: t.title, createdAt: t.createdAt.toISOString(), detail: { status: t.status },
      })),
      ...channelMessages.map((m) => ({
        id: m.id, type: 'message' as const, action: `${m.channel}.${m.direction}`,
        summary: (m.body ?? m.subject).slice(0, 120),
        createdAt: m.createdAt.toISOString(),
        detail: { channel: m.channel, status: m.status },
      })),
    ];
    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return entries.slice(0, limit);
  }
}
