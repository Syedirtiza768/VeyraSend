import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface EventRow {
  id: string;
  eventType: string;
  sgMessageId: string | null;
  recipient: string | null;
  sgTimestamp: number | null;
  createdAt: string;
}

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (!user.permissions.includes('events:read')) {
    return (
      <div>
        <h1>Events log</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>events:read</code>.
          </p>
        </div>
      </div>
    );
  }

  const res = await serverApi<EventRow[]>('/api/events');
  const events = res.data ?? [];

  return (
    <div>
      <h1>Events log</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Ingested from the signed SendGrid event webhook, deduped by <code>sg_event_id</code>.
      </p>
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Recipient</th>
              <th>sg_message_id</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="caption" style={{ padding: 16 }}>
                  No events ingested yet.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className={`pill pill-${e.eventType}`}>{e.eventType}</span>
                  </td>
                  <td>{e.recipient ?? '—'}</td>
                  <td className="caption">{e.sgMessageId ?? '—'}</td>
                  <td className="caption">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
