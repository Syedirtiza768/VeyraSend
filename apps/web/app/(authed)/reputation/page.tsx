import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface ReqRow { id: string; contactId: string; channel: string; status: string; sentAt: string }

export default async function ReputationPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const settings = (await serverApi<{ googleReviewLink: string | null }>('/api/reputation/settings')).data;
  const requests = (await serverApi<ReqRow[]>('/api/reputation/requests')).data ?? [];
  return (
    <div>
      <h1>Reputation</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <p>Google review link: {settings?.googleReviewLink ?? '(not set)'}</p>
        <h3 style={{ marginTop: 16 }}>Review requests</h3>
        {requests.length === 0 ? <p className="caption">None sent yet.</p> : (
          <ul>{requests.map((r) => (
            <li key={r.id}>{r.channel} — {r.status} — contact {r.contactId}</li>
          ))}</ul>
        )}
      </div>
    </div>
  );
}
