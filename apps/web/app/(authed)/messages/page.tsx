import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { MessagesManager } from '../../../components/messages-manager';

interface MessageRow {
  id: string;
  kind: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  status: string;
  sgMessageId: string | null;
  reason: string | null;
  createdAt: string;
}

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (!user.permissions.includes('messages:read')) {
    return (
      <div>
        <h1>Transactional send</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>messages:read</code>.
          </p>
        </div>
      </div>
    );
  }

  const res = await serverApi<MessageRow[]>('/api/messages');
  const provisionRes = await serverApi<{ provisioned: boolean }>('/api/sendgrid/status');

  return (
    <div>
      <h1>Transactional send</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Sends are queued (BullMQ) with retryable backoff and recorded as a message ledger; status is
        reconciled from signed event webhooks.
      </p>
      <MessagesManager
        initialMessages={res.data ?? []}
        provisioned={provisionRes.data?.provisioned ?? false}
        canWrite={user.permissions.includes('messages:write')}
      />
    </div>
  );
}
