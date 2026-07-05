import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface LinkRow {
  id: string;
  contactId: string | null;
  amountCents: number;
  currency: string;
  description: string | null;
  paymentUrl: string;
  status: string;
}

export default async function PaymentLinksPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const links = (await serverApi<LinkRow[]>('/api/billing/payment-links')).data ?? [];
  return (
    <div>
      <h1>Payment links</h1>
      <div className="card" style={{ marginTop: 16 }}>
        {links.length === 0 ? (
          <p className="caption">No payment links yet.</p>
        ) : (
          <ul>
            {links.map((link) => (
              <li key={link.id}>
                {link.status} — {(link.amountCents / 100).toFixed(2)} {link.currency}
                {link.description ? ` — ${link.description}` : ''} — {link.paymentUrl}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
