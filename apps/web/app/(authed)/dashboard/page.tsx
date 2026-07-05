import { getCurrentUser } from '../../../lib/server-api';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const perms = user.permissions;

  return (
    <div>
      <h1>Overview</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Signed in as {user.user.email} · role {user.role.name}
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2>Phase 1 — Auth, Tenancy, RBAC, Users</h2>
        <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
          Secure session login, per-tenant row scoping with RLS, role-based permissions, and an
          audit log are live. SendGrid integration, contacts, templates, campaigns, automations,
          and analytics land in Phases 2–9.
        </p>
      </div>

      <div className="card">
        <h2>Your permissions</h2>
        <table className="status">
          <thead>
            <tr>
              <th>Permission</th>
              <th className="status-pill">Held</th>
            </tr>
          </thead>
          <tbody>
            {['users:read', 'users:write', 'users:delete', 'tenants:read', 'tenants:write', 'audit:read'].map(
              (p) => (
                <tr key={p}>
                  <td className="meta">{p}</td>
                  <td className="status-pill">
                    <span className={perms.includes(p) ? 'pill ok' : 'pill pending'}>
                      {perms.includes(p) ? 'yes' : 'no'}
                    </span>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
