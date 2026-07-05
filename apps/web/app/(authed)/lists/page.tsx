import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { ListsManager } from '../../../components/lists-manager';

interface ListRow { id: string; name: string; memberCount: number; createdAt: string }

export default async function ListsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('lists:read')) {
    return (
      <div>
        <h1>Lists</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>lists:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<ListRow[]>('/api/lists');
  return (
    <div>
      <h1>Lists</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>Static groupings of contacts. Tenant-scoped.</p>
      <ListsManager initialLists={res.data ?? []} canWrite={user.permissions.includes('lists:write')} canDelete={user.permissions.includes('lists:delete')} />
    </div>
  );
}
