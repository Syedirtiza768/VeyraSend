'use client';

interface Overview {
  window: { from: string; to: string };
  messages: { sent: number; delivered: number; failed: number; bounced: number; deferred: number; queued: number };
  events: { processed: number; delivered: number; bounce: number; dropped: number; open: number; click: number; unsubscribe: number; spamreport: number; deferred: number };
  rates: { delivery: number | null; bounce: number | null; open: number | null; click: number | null; unsubscribe: number | null };
  contacts: { total: number; active: number; unsubscribed: number; bounced: number; complained: number };
  campaigns: { total: number; sending: number; sent: number };
}
interface Point { day: string; sent: number; delivered: number; bounced: number; open: number; click: number; unsubscribe: number }

function pct(n: number | null): string {
  return n === null ? '—' : `${(n * 100).toFixed(1)}%`;
}

export function Dashboard({ overview, series }: { overview: Overview | null; series: Point[] }) {
  if (!overview) {
    return <div className="card caption" style={{ padding: 16 }}>No analytics available.</div>;
  }
  const maxSent = Math.max(1, ...series.map((p) => p.sent));
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="stat-grid">
        <Tile label="Sent (ledger)" value={overview.messages.sent} sub={`queued ${overview.messages.queued} · failed ${overview.messages.failed}`} />
        <Tile label="Delivered (events)" value={overview.events.delivered} sub={`processed ${overview.events.processed}`} />
        <Tile label="Bounces" value={overview.events.bounce} sub={`dropped ${overview.events.dropped}`} />
        <Tile label="Opens" value={overview.events.open} sub={`clicks ${overview.events.click}`} />
        <Tile label="Unsubscribes" value={overview.events.unsubscribe} sub={`complaints ${overview.events.spamreport}`} />
        <Tile label="Active contacts" value={overview.contacts.active} sub={`of ${overview.contacts.total} total`} />
      </div>

      <div className="stat-grid">
        <Tile label="Delivery rate" value={pct(overview.rates.delivery)} sub="delivered / (processed+delivered)" />
        <Tile label="Bounce rate" value={pct(overview.rates.bounce)} />
        <Tile label="Open rate" value={pct(overview.rates.open)} sub="opens / delivered" />
        <Tile label="Click rate" value={pct(overview.rates.click)} sub="clicks / delivered" />
        <Tile label="Unsub rate" value={pct(overview.rates.unsubscribe)} />
        <Tile label="Campaigns sent" value={overview.campaigns.sent} sub={`sending ${overview.campaigns.sending}`} />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 12px' }}>Sends — last 30 days</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, borderBottom: '1px solid var(--enxi-color-border)' }}>
          {series.map((p) => (
            <div key={p.day} title={`${p.day}: ${p.sent} sent, ${p.delivered} delivered, ${p.bounced} bounced`} style={{
              flex: 1, minWidth: 4, height: `${(p.sent / maxSent) * 100}%`,
              background: 'var(--enxi-color-primary)', opacity: p.sent ? 0.85 : 0.15, borderRadius: '2px 2px 0 0',
            }} />
          ))}
        </div>
        <div className="caption" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>{series[0]?.day ?? ''}</span><span>{series[series.length - 1]?.day ?? ''}</span>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}
