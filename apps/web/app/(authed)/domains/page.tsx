import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { DomainsManager } from '../../../components/domains-manager';

export default async function DomainsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (!user.permissions.includes('domains:read')) {
    return (
      <div>
        <h1>Domains</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>domains:read</code>.
          </p>
        </div>
      </div>
    );
  }

  const statusRes = await serverApi<{ provisioned: boolean; region: string | null; subuserUsername: string | null; provisionedAt: string | null }>('/api/sendgrid/status');
  const domainsRes = await serverApi<{ data: unknown[] }>('/api/domains');

  return (
    <div>
      <h1>Domains</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Domain authentication (DKIM/SPF). Add the DNS records SendGrid returns, then verify.
      </p>
      <DomainsManager
        initialStatus={statusRes.data ?? { provisioned: false, region: null, subuserUsername: null, provisionedAt: null }}
        initialDomains={(domainsRes.data?.data as never[]) ?? []}
        canWrite={user.permissions.includes('domains:write')}
        canProvision={user.permissions.includes('sendgrid:provision')}
      />
    </div>
  );
}
