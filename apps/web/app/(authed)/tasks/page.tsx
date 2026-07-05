import { getCurrentUser } from '../../../lib/server-api';
import { TasksManager } from '../../../components/tasks-manager';

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('tasks:read')) {
    return (
      <div>
        <h1>Tasks</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ margin: 0 }}>Your role does not include <code>tasks:read</code>.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h1>Tasks</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>Open tasks across contacts, deals, and companies.</p>
      <TasksManager canWrite={user.permissions.includes('tasks:write')} />
    </div>
  );
}
