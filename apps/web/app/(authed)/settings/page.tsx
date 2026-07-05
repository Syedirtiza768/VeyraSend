import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { SettingsManager } from '../../../components/settings-manager';

interface Settings {
  webhookVerificationKey: string | null;
  eventRetentionDays: number;
  messageRetentionDays: number;
  inboundRetentionDays: number;
  updatedAt: string;
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('settings:read')) {
    return (
      <div>
        <h1>Settings</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Your role does not include <code>settings:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<Settings>('/api/settings');
  return (
    <div>
      <h1>Settings</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Tenant-level webhook verification and data retention windows.
      </p>
      <SettingsManager initial={res.data ?? null} canWrite={user.permissions.includes('settings:write')} />
    </div>
  );
}
