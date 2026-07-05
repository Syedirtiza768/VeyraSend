import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { AutomationsManager } from '../../../components/automations-manager';

interface AutomationRow {
  id: string; name: string; status: 'active' | 'paused';
  definition: { trigger: { event: string }; steps: { type: string }[] };
  createdAt: string;
}

export default async function AutomationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('automations:read')) {
    return (
      <div>
        <h1>Automations</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>automations:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<AutomationRow[]>('/api/automations');
  return (
    <div>
      <h1>Automations</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Trigger: <code>contact.created</code>. Steps: <code>send</code>, <code>delay</code> (durationMs), <code>branch</code> (field/op/value, thenStep/elseStep). A ticker enrolls new contacts and advances due steps.
      </p>
      <AutomationsManager initialAutomations={res.data ?? []} canWrite={user.permissions.includes('automations:write')} canDelete={user.permissions.includes('automations:delete')} />
    </div>
  );
}
