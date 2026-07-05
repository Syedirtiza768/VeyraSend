import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { SuppressionsManager } from '../../../components/suppressions-manager';

interface SuppressionRow { id: string; email: string; reason: string; source: string; createdAt: string }

export default async function SuppressionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('suppressions:read')) {
    return (
      <div>
        <h1>Suppressions</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>suppressions:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<SuppressionRow[]>('/api/suppressions');
  return (
    <div>
      <h1>Suppressions</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Bounces, unsubscribes and complaints. Auto-recorded from event webhooks; campaigns always exclude these recipients.
      </p>
      <SuppressionsManager initialSuppressions={res.data ?? []} canWrite={user.permissions.includes('suppressions:write')} />
    </div>
  );
}
