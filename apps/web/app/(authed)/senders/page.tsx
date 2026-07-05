import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { SendersManager } from '../../../components/senders-manager';

export default async function SendersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (!user.permissions.includes('senders:read')) {
    return (
      <div>
        <h1>Senders</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>senders:read</code>.
          </p>
        </div>
      </div>
    );
  }

  const statusRes = await serverApi<{ provisioned: boolean; region: string | null; subuserUsername: string | null; provisionedAt: string | null }>('/api/sendgrid/status');
  const sendersRes = await serverApi<{ data: unknown[] }>('/api/senders');

  return (
    <div>
      <h1>Senders</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Single-sender verification. Tenant isolation enforced server-side.
      </p>
      <SendersManager
        initialStatus={statusRes.data ?? { provisioned: false, region: null, subuserUsername: null, provisionedAt: null }}
        initialSenders={(sendersRes.data?.data as never[]) ?? []}
        canWrite={user.permissions.includes('senders:write')}
        canProvision={user.permissions.includes('sendgrid:provision')}
      />
    </div>
  );
}
