import { getCurrentUser, serverApi } from '../../../../lib/server-api';

interface PlanRow {
  id: string;
  name: string;
  priceCents: number;
  interval: string;
  featureFlags: string[];
}

export default async function AgencyBillingPlansPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const plans = (await serverApi<PlanRow[]>('/api/agency/billing-plans')).data ?? [];
  return (
    <div>
      <h1>Billing plans</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <ul>
          {plans.map((p) => (
            <li key={p.id}>
              {p.name} — ${(p.priceCents / 100).toFixed(2)}/{p.interval} — flags: {p.featureFlags.join(', ')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
