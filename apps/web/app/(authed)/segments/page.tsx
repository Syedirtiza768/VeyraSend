import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { SegmentsManager } from '../../../components/segments-manager';

interface SegmentDef { combinator: 'and' | 'or'; rules: { field: string; op: string; value: string }[] }
interface SegmentRow { id: string; name: string; definition: SegmentDef; createdAt: string }

export default async function SegmentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('segments:read')) {
    return (
      <div>
        <h1>Segments</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>segments:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<SegmentRow[]>('/api/segments');
  return (
    <div>
      <h1>Segments</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Rule-based, evaluated live against contacts. Fields: <code>email</code>, <code>status</code>, <code>list</code> (value = list id), <code>custom:&lt;key&gt;</code>. Ops: <code>eq</code>, <code>ne</code>, <code>contains</code>, <code>domain_eq</code>.
      </p>
      <SegmentsManager initialSegments={res.data ?? []} canWrite={user.permissions.includes('segments:write')} canDelete={user.permissions.includes('segments:delete')} />
    </div>
  );
}
