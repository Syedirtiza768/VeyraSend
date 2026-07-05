import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface UsageRow {
  window: { from: string; to: string };
  counts: {
    contacts: number; activeContacts: number; lists: number; segments: number;
    templates: number; campaigns: number; automations: number; suppressions: number;
  };
  thisMonth: {
    messages: number; transactional: number; campaign: number; automation: number;
    events: number; delivered: number; bounces: number; opens: number; clicks: number;
  };
  subuser: { provisioned: boolean; username: string | null };
  providers: Record<string, Array<{ metric: string; quantity: number; costMicros: number | null }>>;
}

/**
 * Phase 10 — usage & billing inputs. Computes tenant inventory counts and the
 * current-month send/event volume from the ledger + raw events. The SendGrid
 * subuser provisioning state is surfaced so billing can reconcile entitlements.
 */
@Injectable()
export class UsageService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async overview(tenantId: string): Promise<UsageRow> {
    const tid = assertTenant(tenantId);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);

    const counts = await this.ds.query(
      `SELECT
         COUNT(*) FILTER (WHERE deleted_at IS NULL) AS contacts,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND status='active') AS active_contacts,
         (SELECT COUNT(*) FROM lists WHERE tenant_id=$1) AS lists,
         (SELECT COUNT(*) FROM segments WHERE tenant_id=$1) AS segments,
         (SELECT COUNT(*) FROM templates WHERE tenant_id=$1 AND deleted_at IS NULL) AS templates,
         (SELECT COUNT(*) FROM campaigns WHERE tenant_id=$1 AND deleted_at IS NULL) AS campaigns,
         (SELECT COUNT(*) FROM automations WHERE tenant_id=$1 AND deleted_at IS NULL) AS automations,
         (SELECT COUNT(*) FROM suppressions WHERE tenant_id=$1) AS suppressions
       FROM contacts WHERE tenant_id=$1`,
      [tid],
    );
    const c = counts[0] ?? {};

    const month = await this.ds.query(
      `SELECT
         COUNT(*) AS messages,
         COUNT(*) FILTER (WHERE kind='transactional') AS transactional,
         COUNT(*) FILTER (WHERE kind='campaign') AS campaign,
         COUNT(*) FILTER (WHERE kind='automation') AS automation
       FROM messages WHERE tenant_id=$1 AND created_at >= $2`,
      [tid, from],
    );
    const monthEvents = await this.ds.query(
      `SELECT
         COUNT(*) AS events,
         COUNT(*) FILTER (WHERE event_type='delivered') AS delivered,
         COUNT(*) FILTER (WHERE event_type='bounce') AS bounces,
         COUNT(*) FILTER (WHERE event_type='open') AS opens,
         COUNT(*) FILTER (WHERE event_type='click') AS clicks
       FROM email_events WHERE tenant_id=$1 AND created_at >= $2`,
      [tid, from],
    );
    const m = month[0] ?? {};
    const me = monthEvents[0] ?? {};

    const sg = await this.ds.query(
      `SELECT subuser_username AS username FROM tenant_sendgrid_settings WHERE tenant_id=$1 LIMIT 1`,
      [tid],
    );
    const sub = sg[0] ?? {};

    const providerRows = await this.ds.query(
      `SELECT provider, metric, quantity, cost_micros
       FROM usage_records WHERE tenant_id=$1 AND period_start >= $2`,
      [tid, from.toISOString().slice(0, 10)],
    );
    const providers: UsageRow['providers'] = {};
    for (const r of providerRows as Array<{ provider: string; metric: string; quantity: string; cost_micros: string | null }>) {
      if (!providers[r.provider]) providers[r.provider] = [];
      providers[r.provider]!.push({
        metric: r.metric,
        quantity: Number(r.quantity ?? 0),
        costMicros: r.cost_micros != null ? Number(r.cost_micros) : null,
      });
    }

    return {
      window: { from: from.toISOString(), to: now.toISOString() },
      counts: {
        contacts: Number(c.contacts ?? 0), activeContacts: Number(c.active_contacts ?? 0),
        lists: Number(c.lists ?? 0), segments: Number(c.segments ?? 0),
        templates: Number(c.templates ?? 0), campaigns: Number(c.campaigns ?? 0),
        automations: Number(c.automations ?? 0), suppressions: Number(c.suppressions ?? 0),
      },
      thisMonth: {
        messages: Number(m.messages ?? 0), transactional: Number(m.transactional ?? 0),
        campaign: Number(m.campaign ?? 0), automation: Number(m.automation ?? 0),
        events: Number(me.events ?? 0), delivered: Number(me.delivered ?? 0),
        bounces: Number(me.bounces ?? 0), opens: Number(me.opens ?? 0), clicks: Number(me.clicks ?? 0),
      },
      subuser: { provisioned: !!sub.username, username: sub.username ?? null },
      providers,
    };
  }

  async agencyRollup(agencyTenantId: string) {
    const tid = assertTenant(agencyTenantId);
    const agency = await this.ds.getRepository(Tenant).findOne({ where: { id: tid } });
    if (!agency || agency.type !== 'agency') {
      throw new ForbiddenException('Agency context required.');
    }

    const subs = await this.ds.getRepository(Tenant).find({
      where: { parentTenantId: tid, type: 'sub_account' },
    });
    const tenantIds = [tid, ...subs.map((s) => s.id)];
    const now = new Date();
    const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;

    const rows = await this.ds.query(
      `SELECT ur.tenant_id, t.name AS tenant_name, ur.provider, ur.metric,
              SUM(ur.quantity::bigint) AS quantity,
              SUM(COALESCE(ur.cost_micros, 0)::bigint) AS cost_micros,
              SUM(COALESCE(ur.billed_micros, 0)::bigint) AS billed_micros
       FROM usage_records ur
       JOIN tenants t ON t.id = ur.tenant_id
       WHERE ur.tenant_id = ANY($1::uuid[]) AND ur.period_start >= $2::date
       GROUP BY ur.tenant_id, t.name, ur.provider, ur.metric
       ORDER BY t.name, ur.provider, ur.metric`,
      [tenantIds, periodStart],
    );

    return {
      agencyId: tid,
      periodStart,
      subAccounts: subs.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
      rollup: rows.map((r: {
        tenant_id: string; tenant_name: string; provider: string; metric: string;
        quantity: string; cost_micros: string; billed_micros: string;
      }) => ({
        tenantId: r.tenant_id,
        tenantName: r.tenant_name,
        provider: r.provider,
        metric: r.metric,
        quantity: Number(r.quantity),
        costMicros: Number(r.cost_micros),
        billedMicros: Number(r.billed_micros),
      })),
    };
  }
}
