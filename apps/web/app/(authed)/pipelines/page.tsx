import { getCurrentUser } from '../../../lib/server-api';
import { PipelineBoard } from '../../../components/pipeline-board';

export default async function PipelinesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('deals:read')) {
    return (
      <div>
        <h1>Pipelines</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ margin: 0 }}>Your role does not include <code>deals:read</code>.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h1>Pipelines</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>Kanban view — move deals across stages.</p>
      <PipelineBoard canWrite={user.permissions.includes('deals:write')} />
    </div>
  );
}
