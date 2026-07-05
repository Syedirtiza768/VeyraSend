import { getCurrentUser, serverApi } from '../../../../lib/server-api';
import { NotesPanel, TasksPanel } from '../../../../components/entity-panels';

interface DealRow {
  id: string;
  name: string;
  status: string;
  valueCents: string | null;
  currency: string;
  contactId: string | null;
  companyId: string | null;
  stageId: string;
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('deals:read')) {
    return <div><h1>Deal</h1><div className="card"><p>Access denied.</p></div></div>;
  }

  const res = await serverApi<DealRow>(`/api/deals/${id}`);
  if (!res.data) {
    return <div><h1>Deal</h1><div className="card"><p>Deal not found or you don&apos;t have access.</p></div></div>;
  }
  const deal = res.data;

  return (
    <div>
      <h1>{deal.name}</h1>
      <p className="meta">Status: {deal.status}{deal.valueCents ? ` · ${deal.currency} ${(Number(deal.valueCents) / 100).toFixed(2)}` : ''}</p>
      {deal.contactId ? <p className="caption"><a href={`/contacts/${deal.contactId}`}>View contact</a></p> : null}
      <div className="mgr-grid" style={{ marginTop: 24 }}>
        {user.permissions.includes('notes:read') ? (
          <NotesPanel entityType="deal" entityId={id} canWrite={user.permissions.includes('notes:write')} />
        ) : null}
        {user.permissions.includes('tasks:read') ? (
          <TasksPanel entityType="deal" entityId={id} canWrite={user.permissions.includes('tasks:write')} />
        ) : null}
      </div>
    </div>
  );
}
