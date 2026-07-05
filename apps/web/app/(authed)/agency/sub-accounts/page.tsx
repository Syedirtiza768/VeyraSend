import { getCurrentUser, serverApi } from '../../../../lib/server-api';

interface SubRow { id: string; name: string; slug: string; createdAt: string }

export default async function AgencySubAccountsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const subs = (await serverApi<SubRow[]>('/api/agency/sub-accounts')).data ?? [];
  return (
    <div>
      <h1>Sub-accounts</h1>
      <div className="card" style={{ marginTop: 16 }}>
        {subs.length === 0 ? (
          <p className="caption">No sub-accounts yet. Create one via the API.</p>
        ) : (
          <ul>
            {subs.map((s) => (
              <li key={s.id}>{s.name} ({s.slug}) — {s.id}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
