import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface ApptRow { id: string; contactId: string; startsAt: string; status: string }

export default async function AppointmentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const res = await serverApi<ApptRow[]>('/api/appointments');
  const rows = res.data ?? [];
  return (
    <div>
      <h1>Appointments</h1>
      <div className="card" style={{ marginTop: 16 }}>
        {rows.length === 0 ? <p className="caption">No appointments yet.</p> : (
          <table className="data-table"><thead><tr><th>Starts</th><th>Status</th><th>Contact</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}><td>{r.startsAt}</td><td>{r.status}</td><td>{r.contactId}</td></tr>
            ))}</tbody></table>
        )}
      </div>
    </div>
  );
}
