import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { Dashboard } from '../../../components/dashboard';

interface Overview {
  window: { from: string; to: string };
  messages: { sent: number; delivered: number; failed: number; bounced: number; deferred: number; queued: number };
  events: { processed: number; delivered: number; bounce: number; dropped: number; open: number; click: number; unsubscribe: number; spamreport: number; deferred: number };
  rates: { delivery: number | null; bounce: number | null; open: number | null; click: number | null; unsubscribe: number | null };
  contacts: { total: number; active: number; unsubscribed: number; bounced: number; complained: number };
  campaigns: { total: number; sending: number; sent: number };
}
interface Point { day: string; sent: number; delivered: number; bounced: number; open: number; click: number; unsubscribe: number }

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('analytics:read')) {
    return (
      <div>
        <h1>Analytics</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>analytics:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const [ov, ts] = await Promise.all([
    serverApi<Overview>('/api/analytics/overview'),
    serverApi<Point[]>('/api/analytics/timeseries'),
  ]);
  return (
    <div>
      <h1>Analytics</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Reconciled from the message ledger and raw event webhooks (last 30 days).
      </p>
      <Dashboard overview={ov.data ?? null} series={ts.data ?? []} />
    </div>
  );
}
