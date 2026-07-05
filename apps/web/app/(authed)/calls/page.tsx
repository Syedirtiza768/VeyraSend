import { getCurrentUser } from '../../../lib/server-api';
import { CallsManager } from '../../../components/calls-manager';

export default async function CallsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('calls:read')) {
    return (
      <div>
        <h1>Calls</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ margin: 0 }}>Your role does not include <code>calls:read</code>.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h1>Calls</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>Inbound and outbound call log with status and disposition.</p>
      <CallsManager />
    </div>
  );
}
