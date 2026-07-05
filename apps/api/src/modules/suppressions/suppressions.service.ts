import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Suppression, type SuppressionReason } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface SuppressionRow {
  id: string;
  email: string;
  reason: SuppressionReason;
  source: string;
  createdAt: string;
}

const REASONS: SuppressionReason[] = ['unsubscribe', 'bounce', 'complaint', 'manual'];

@Injectable()
export class SuppressionsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string): Promise<SuppressionRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Suppression).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
    });
    return rows.map((s) => ({
      id: s.id,
      email: s.email,
      reason: s.reason,
      source: s.source,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async add(tenantId: string, email: string, reason: SuppressionReason, source = 'manual'): Promise<SuppressionRow> {
    const tid = assertTenant(tenantId);
    const e = email.toLowerCase().trim();
    if (!e) throw new BadRequestException('email is required');
    if (!REASONS.includes(reason)) throw new BadRequestException(`reason must be one of ${REASONS.join(', ')}`);

    const existing = await this.ds.getRepository(Suppression).findOne({ where: { tenantId: tid, email: e, reason } });
    if (existing) {
      return {
        id: existing.id,
        email: existing.email,
        reason: existing.reason,
        source: existing.source,
        createdAt: existing.createdAt.toISOString(),
      };
    }
    const row = this.ds.getRepository(Suppression).create({ tenantId: tid, email: e, reason, source });
    await this.ds.getRepository(Suppression).save(row);
    return {
      id: row.id,
      email: row.email,
      reason: row.reason,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Suppression).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Suppression not found in this tenant.');
    await this.ds.getRepository(Suppression).delete({ id, tenantId: tid });
  }

  /** Set of suppressed emails for a tenant (used to filter campaign recipients). */
  async suppressedEmails(tenantId: string): Promise<Set<string>> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Suppression).find({
      where: { tenantId: tid },
      select: ['email'],
    });
    return new Set(rows.map((r) => r.email));
  }
}
