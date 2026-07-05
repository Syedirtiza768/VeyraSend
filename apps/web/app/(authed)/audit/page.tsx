import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface AuditItem {
  id: string; action: string; entityType: string | null; entityId: string | null;
  actorUserId: string | null; detail: Record<string, unknown> | null; createdAt: string;
}
interface AuditResult { items: AuditItem[]; total: number }

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('audit:read')) {
    return (
      <div>
        <h1>Audit log</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>audit:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<AuditResult>('/api/audit?limit=100');
  const items = res.data?.items ?? [];

  return (
    <div>
      <h1>Audit log</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Tenant-scoped record of state-changing actions. {res.data?.total ?? 0} total entries.
      </p>
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr><th>Action</th><th>Entity</th><th>Detail</th><th>When</th></tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="caption" style={{ padding: 16 }}>No audit entries yet.</td></tr>
            ) : items.map((a) => (
              <tr key={a.id}>
                <td><code>{a.action}</code></td>
                <td className="caption">{a.entityType ?? '—'}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ''}</td>
                <td className="caption" style={{ maxWidth: 420, wordBreak: 'break-word' }}>
                  {a.detail ? JSON.stringify(a.detail) : '—'}
                </td>
                <td className="caption">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
