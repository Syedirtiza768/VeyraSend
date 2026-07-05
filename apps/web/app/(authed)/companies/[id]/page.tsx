import { getCurrentUser, serverApi } from '../../../../lib/server-api';
import { NotesPanel, TasksPanel } from '../../../../components/entity-panels';

interface CompanyDetail {
  id: string;
  name: string;
  domain: string | null;
  contacts: { id: string; email: string; firstName: string | null; lastName: string | null }[];
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('companies:read')) {
    return <div><h1>Company</h1><div className="card"><p>Access denied.</p></div></div>;
  }

  const res = await serverApi<CompanyDetail>(`/api/companies/${id}`);
  if (!res.data) {
    return <div><h1>Company</h1><div className="card"><p>Company not found or you don&apos;t have access.</p></div></div>;
  }
  const company = res.data;

  return (
    <div>
      <h1>{company.name}</h1>
      {company.domain ? <p className="meta">{company.domain}</p> : null}
      <div className="mgr-grid" style={{ marginTop: 24 }}>
        <div className="mgr-side">
          {user.permissions.includes('notes:read') ? (
            <NotesPanel entityType="company" entityId={id} canWrite={user.permissions.includes('notes:write')} />
          ) : null}
          {user.permissions.includes('tasks:read') ? (
            <TasksPanel entityType="company" entityId={id} canWrite={user.permissions.includes('tasks:write')} />
          ) : null}
        </div>
        <div className="card" style={{ padding: 0 }}>
          <h3 style={{ padding: 16, margin: 0 }}>Linked contacts</h3>
          <table className="data-table">
            <thead><tr><th>Email</th><th>Name</th></tr></thead>
            <tbody>
              {company.contacts.length === 0 ? (
                <tr><td colSpan={2} className="caption" style={{ padding: 16 }}>No linked contacts.</td></tr>
              ) : company.contacts.map((c) => (
                <tr key={c.id}>
                  <td><a href={`/contacts/${c.id}`}>{c.email}</a></td>
                  <td>{[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
