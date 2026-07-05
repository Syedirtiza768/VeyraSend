import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { Message, EmailEvent } from '@veyrasend/db';

export interface OverviewStats {
  window: { from: string; to: string };
  messages: { sent: number; delivered: number; failed: number; bounced: number; deferred: number; queued: number };
  events: {
    processed: number; delivered: number; bounce: number; dropped: number;
    open: number; click: number; unsubscribe: number; spamreport: number; deferred: number;
  };
  rates: { delivery: number | null; bounce: number | null; open: number | null; click: number | null; unsubscribe: number | null };
  contacts: { total: number; active: number; unsubscribed: number; bounced: number; complained: number };
  campaigns: { total: number; sending: number; sent: number };
}

export interface TimeseriesPoint {
  day: string;
  sent: number;
  delivered: number;
  bounced: number;
  open: number;
  click: number;
  unsubscribe: number;
}

export interface TemplateStat {
  templateId: string;
  name: string | null;
  sends: number;
  delivered: number;
  bounced: number;
  opens: number;
  clicks: number;
}

/**
 * Phase 9 — analytics. Reconciles the `messages` ledger (write path) with the
 * raw `email_events` stream (webhook path) and surfaces derived rates. We do
 * not store precomputed aggregates; everything is computed on read from the two
 * sources of truth, with events authoritative for engagement/delivery state.
 */
@Injectable()
export class AnalyticsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async overview(tenantId: string, windowDays = 30): Promise<OverviewStats> {
    const tid = assertTenant(tenantId);
    const to = new Date();
    const from = new Date(to.getTime() - windowDays * 86400_000);

    const msgRepo = this.ds.getRepository(Message);
    const evtRepo = this.ds.getRepository(EmailEvent);

    const messages = await msgRepo
      .createQueryBuilder('m')
      .select('m.status', 'status')
      .addSelect('COUNT(*)', 'n')
      .where('m.tenant_id = :tid', { tid })
      .andWhere('m.created_at >= :from', { from })
      .groupBy('m.status')
      .getRawMany<{ status: string; n: string }>();

    const msgCounts: Record<string, number> = {};
    for (const r of messages) msgCounts[r.status] = Number(r.n);

    const events = await evtRepo
      .createQueryBuilder('e')
      .select('e.event_type', 'type')
      .addSelect('COUNT(*)', 'n')
      .where('e.tenant_id = :tid', { tid })
      .andWhere('e.created_at >= :from', { from })
      .groupBy('e.event_type')
      .getRawMany<{ type: string; n: string }>();

    const evtCounts: Record<string, number> = {};
    for (const r of events) evtCounts[r.type] = Number(r.n);

    const processed = evtCounts['processed'] ?? 0;
    const delivered = evtCounts['delivered'] ?? 0;
    const bounce = evtCounts['bounce'] ?? 0;
    const dropped = evtCounts['dropped'] ?? 0;
    const open = evtCounts['open'] ?? 0;
    const click = evtCounts['click'] ?? 0;
    const unsubscribe = evtCounts['unsubscribe'] ?? 0;
    const spamreport = evtCounts['spamreport'] ?? 0;
    const deferred = evtCounts['deferred'] ?? 0;

    const denom = processed + delivered || 0;
    const delivery = denom ? round(delivered / denom) : null;
    const bounceRate = denom ? round(bounce / denom) : null;
    const openRate = delivered ? round(open / delivered) : null;
    const clickRate = delivered ? round(click / delivered) : null;
    const unsubRate = delivered ? round(unsubscribe / delivered) : null;

    const contactRow = await this.ds.query(
      `SELECT
         COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total,
         COUNT(*) FILTER (WHERE deleted_at IS NULL AND status='active') AS active,
         COUNT(*) FILTER (WHERE status='unsubscribed') AS unsubscribed,
         COUNT(*) FILTER (WHERE status='bounced') AS bounced,
         COUNT(*) FILTER (WHERE status='complained') AS complained
       FROM contacts WHERE tenant_id=$1`,
      [tid],
    );
    const c = contactRow[0] ?? {};

    const campRow = await this.ds.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status='sending') AS sending,
         COUNT(*) FILTER (WHERE status='sent') AS sent
       FROM campaigns WHERE tenant_id=$1 AND deleted_at IS NULL`,
      [tid],
    );
    const cm = campRow[0] ?? {};

    return {
      window: { from: from.toISOString(), to: to.toISOString() },
      messages: {
        sent: msgCounts['sent'] ?? 0,
        delivered: msgCounts['delivered'] ?? 0,
        failed: msgCounts['failed'] ?? 0,
        bounced: msgCounts['bounced'] ?? 0,
        deferred: msgCounts['deferred'] ?? 0,
        queued: msgCounts['queued'] ?? 0,
      },
      events: { processed, delivered, bounce, dropped, open, click, unsubscribe, spamreport, deferred },
      rates: { delivery, bounce: bounceRate, open: openRate, click: clickRate, unsubscribe: unsubRate },
      contacts: {
        total: Number(c.total ?? 0), active: Number(c.active ?? 0), unsubscribed: Number(c.unsubscribed ?? 0),
        bounced: Number(c.bounced ?? 0), complained: Number(c.complained ?? 0),
      },
      campaigns: { total: Number(cm.total ?? 0), sending: Number(cm.sending ?? 0), sent: Number(cm.sent ?? 0) },
    };
  }

  async timeseries(tenantId: string, windowDays = 30): Promise<TimeseriesPoint[]> {
    const tid = assertTenant(tenantId);
    const to = new Date();
    const from = new Date(to.getTime() - (windowDays - 1) * 86400_000);

    const msgSeries = await this.ds.query(
      `SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
              COUNT(*) AS sent
       FROM messages WHERE tenant_id=$1 AND created_at >= $2
       GROUP BY 1 ORDER BY 1`,
      [tid, from],
    );
    const evtSeries = await this.ds.query(
      `SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
              COUNT(*) FILTER (WHERE event_type='delivered') AS delivered,
              COUNT(*) FILTER (WHERE event_type='bounce') AS bounced,
              COUNT(*) FILTER (WHERE event_type='open') AS open,
              COUNT(*) FILTER (WHERE event_type='click') AS click,
              COUNT(*) FILTER (WHERE event_type='unsubscribe') AS unsubscribe
       FROM email_events WHERE tenant_id=$1 AND created_at >= $2
       GROUP BY 1 ORDER BY 1`,
      [tid, from],
    );

    const map = new Map<string, TimeseriesPoint>();
    // Buckets ending today (UTC), going back windowDays days.
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(to.getTime() - i * 86400_000);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { day: key, sent: 0, delivered: 0, bounced: 0, open: 0, click: 0, unsubscribe: 0 });
    }
    for (const r of msgSeries) {
      const p = map.get(r.day);
      if (p) p.sent = Number(r.sent);
    }
    for (const r of evtSeries) {
      const p = map.get(r.day);
      if (!p) continue;
      p.delivered = Number(r.delivered);
      p.bounced = Number(r.bounced);
      p.open = Number(r.open);
      p.click = Number(r.click);
      p.unsubscribe = Number(r.unsubscribe);
    }
    return Array.from(map.values());
  }

  async topTemplates(_tenantId: string, _windowDays = 30, _limit = 10): Promise<TemplateStat[]> {
    // Template-level attribution requires a template_id on the messages ledger,
    // which is not stored today. Surfaced as an empty series until added.
    return [];
  }
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
