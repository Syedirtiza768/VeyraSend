import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { WorkflowsManager } from '../../../components/workflows-manager';

interface WorkflowRow {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'paused' | 'archived';
  currentVersionId: string | null;
  draftVersion: { id: string; version: number; definition: { trigger: { type: string }; steps: { type: string }[] } } | null;
  publishedVersion: { id: string; version: number; definition: { trigger: { type: string }; steps: { type: string }[] } } | null;
  createdAt: string;
}

export default async function WorkflowsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('workflows:read')) {
    return (
      <div>
        <h1>Workflows</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>workflows:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<WorkflowRow[]>('/api/workflows');
  return (
    <div>
      <h1>Workflows</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Event-driven automation engine. Steps: <code>send_email</code>, <code>delay</code> (durationSeconds),{' '}
        <code>condition</code>, <code>send_sms</code>, <code>add_tag</code>, <code>create_task</code>, <code>stop</code>.
        Publish to go live; use dry-run to preview without sending.
      </p>
      <WorkflowsManager
        initialWorkflows={res.data ?? []}
        canWrite={user.permissions.includes('workflows:write')}
        canPublish={user.permissions.includes('workflows:publish')}
      />
    </div>
  );
}
