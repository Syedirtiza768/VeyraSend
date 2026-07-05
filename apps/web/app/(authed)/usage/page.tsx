import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface Usage {
  window: { from: string; to: string };
  counts: { contacts: number; activeContacts: number; lists: number; segments: number; templates: number; campaigns: number; automations: number; suppressions: number };
  thisMonth: { messages: number; transactional: number; campaign: number; automation: number; events: number; delivered: number; bounces: number; opens: number; clicks: number };
  subuser: { provisioned: boolean; username: string | null };
}

export default async function UsagePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('usage:read')) {
    return (
      <div>
        <h1>Usage &amp; billing</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>usage:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<Usage>('/api/usage');
  const u = res.data;
  if (!u) return <div><h1>Usage &amp; billing</h1><div className="card caption" style={{ padding: 16 }}>No usage available.</div></div>;

  return (
    <div>
      <h1>Usage &amp; billing</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Current month: {new Date(u.window.from).toLocaleDateString()} → {new Date(u.window.to).toLocaleDateString()}.
        Subuser: {u.subuser.provisioned ? <code>{u.subuser.username}</code> : 'not provisioned'}.
      </p>

      <h3>This month</h3>
      <div className="stat-grid">
        <Tile label="Messages" value={u.thisMonth.messages} sub={`txn ${u.thisMonth.transactional} · camp ${u.thisMonth.campaign} · auto ${u.thisMonth.automation}`} />
        <Tile label="Events" value={u.thisMonth.events} />
        <Tile label="Delivered" value={u.thisMonth.delivered} />
        <Tile label="Bounces" value={u.thisMonth.bounces} />
        <Tile label="Opens" value={u.thisMonth.opens} />
        <Tile label="Clicks" value={u.thisMonth.clicks} />
      </div>

      <h3 style={{ marginTop: 24 }}>Inventory</h3>
      <div className="stat-grid">
        <Tile label="Contacts" value={u.counts.contacts} sub={`${u.counts.activeContacts} active`} />
        <Tile label="Lists" value={u.counts.lists} />
        <Tile label="Segments" value={u.counts.segments} />
        <Tile label="Templates" value={u.counts.templates} />
        <Tile label="Campaigns" value={u.counts.campaigns} />
        <Tile label="Automations" value={u.counts.automations} />
        <Tile label="Suppressions" value={u.counts.suppressions} />
      </div>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}
