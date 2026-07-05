import { getCurrentUser } from '../../../lib/server-api';
import { serverApi } from '../../../lib/server-api';
import { UsersManager } from '../../../components/users-manager';

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canRead = user.permissions.includes('users:read');
  if (!canRead) {
    return (
      <div>
        <h1>Users</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>users:read</code>. Request access from a workspace
            admin.
          </p>
        </div>
      </div>
    );
  }

  const usersRes = await serverApi<{ data: UsersRow[] }>('/api/users');
  const rolesRes = await serverApi<{ data: RoleRow[] }>('/api/users/roles');

  return (
    <div>
      <h1>Users</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Members of this tenant. Tenant isolation enforced server-side.
      </p>
      <UsersManager
        initialUsers={usersRes.data?.data ?? []}
        roles={rolesRes.data?.data ?? []}
        canWrite={user.permissions.includes('users:write')}
        selfId={user.user.id}
      />
    </div>
  );
}

interface UsersRow {
  userId: string;
  email: string;
  name: string | null;
  roleId: string;
  roleName: string;
  permissions: string[];
  createdAt: string;
}

interface RoleRow {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
}
