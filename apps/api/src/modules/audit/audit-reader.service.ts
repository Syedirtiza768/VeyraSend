import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface AuditListRow {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  actorUserId: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditListResult {
  items: AuditListRow[];
  total: number;
}

/**
 * Phase 10 — read side of the audit log. The write side lives in `AuditService`
 * and is called by every state-changing controller. Here we expose filtered,
 * paginated reads for the admin audit viewer.
 */
@Injectable()
export class AuditReaderService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(
    tenantId: string,
    opts: { limit?: number; offset?: number; action?: string; entityType?: string } = {},
  ): Promise<AuditListResult> {
    const tid = assertTenant(tenantId);
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const offset = Math.max(opts.offset ?? 0, 0);

    const qb = this.ds.getRepository(AuditLog).createQueryBuilder('a').where('a.tenantId = :tid', { tid });
    if (opts.action) qb.andWhere('a.action = :action', { action: opts.action });
    if (opts.entityType) qb.andWhere('a.entityType = :entityType', { entityType: opts.entityType });

    const total = await qb.getCount();
    const rows = await qb.orderBy('a.createdAt', 'DESC').skip(offset).take(limit).getMany();

    return {
      total,
      items: rows.map((r) => ({
        id: r.id, action: r.action, entityType: r.entityType, entityId: r.entityId,
        actorUserId: r.actorUserId, detail: r.detail, createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async agencyElevationEvents(agencyTenantId: string, limit = 50): Promise<AuditListResult> {
    const tid = assertTenant(agencyTenantId);
    const cap = Math.min(Math.max(limit, 1), 200);
    const subs = await this.ds.query(`SELECT id FROM tenants WHERE parent_tenant_id = $1`, [tid]);
    const tenantIds = [tid, ...(subs as { id: string }[]).map((s) => s.id)];
    if (tenantIds.length === 0) return { items: [], total: 0 };

    const rows = await this.ds.query(
      `SELECT * FROM audit_logs
       WHERE tenant_id = ANY($1::uuid[])
         AND action IN ('agency.act_as.start', 'agency.act_as.end')
       ORDER BY created_at DESC
       LIMIT $2`,
      [tenantIds, cap],
    );

    const items = (rows as Array<{
      id: string;
      action: string;
      entity_type?: string | null;
      entity_id?: string | null;
      actor_user_id?: string | null;
      detail: Record<string, unknown> | null;
      created_at: Date | string;
    }>).map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entity_type ?? null,
      entityId: r.entity_id ?? null,
      actorUserId: r.actor_user_id ?? null,
      detail: r.detail,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));

    return { items, total: items.length };
  }
}
