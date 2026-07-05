import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface CalendarRow { id: string; name: string; bookingSlug: string; timezone: string; createdAt: string }

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const res = await serverApi<CalendarRow[]>('/api/calendar');
  const calendars = res.data ?? [];
  return (
    <div>
      <h1>Calendar</h1>
      <p className="meta">Public booking links: <code>/book/[slug]</code></p>
      <div className="card" style={{ marginTop: 16 }}>
        {calendars.length === 0 ? (
          <p className="caption">No calendars yet. Create one via API POST /api/calendar.</p>
        ) : (
          <ul>{calendars.map((c) => (
            <li key={c.id}><strong>{c.name}</strong> — slug: <code>{c.bookingSlug}</code></li>
          ))}</ul>
        )}
      </div>
    </div>
  );
}
