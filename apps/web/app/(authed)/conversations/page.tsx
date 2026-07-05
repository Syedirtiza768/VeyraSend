import { getCurrentUser } from '../../../lib/server-api';
import { ConversationsManager } from '../../../components/conversations-manager';

export default async function ConversationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('conversations:read')) {
    return (
      <div>
        <h1>Conversations</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>conversations:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const canWrite = user.permissions.includes('conversations:write');
  return (
    <div>
      <h1>Conversations</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Unified inbox across email, SMS, and voice — one thread per contact, filterable by channel.
      </p>
      <ConversationsManager canWrite={canWrite} />
    </div>
  );
}
