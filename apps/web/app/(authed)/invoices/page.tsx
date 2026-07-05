import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface InvoiceRow {
  id: string;
  contactId: string;
  status: string;
  totalCents: number;
  currency: string;
  paymentUrl: string | null;
  paidAt: string | null;
}

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const invoices = (await serverApi<InvoiceRow[]>('/api/billing/invoices')).data ?? [];
  return (
    <div>
      <h1>Invoices</h1>
      <div className="card" style={{ marginTop: 16 }}>
        {invoices.length === 0 ? (
          <p className="caption">No invoices yet. Create one via the API.</p>
        ) : (
          <ul>
            {invoices.map((inv) => (
              <li key={inv.id}>
                {inv.status} — {(inv.totalCents / 100).toFixed(2)} {inv.currency} — contact {inv.contactId}
                {inv.paymentUrl ? ` — ${inv.paymentUrl}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
