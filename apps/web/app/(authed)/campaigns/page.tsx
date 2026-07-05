import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { CampaignsManager } from '../../../components/campaigns-manager';

interface CampaignRow {
  id: string; name: string; templateId: string; segmentId: string; fromEmail: string;
  status: string; scheduledAt: string | null; recipients: number; createdAt: string;
}
interface TemplateRow { id: string; name: string }
interface SegmentRow { id: string; name: string }

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('campaigns:read')) {
    return (
      <div>
        <h1>Campaigns</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>campaigns:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const [camps, templates, segments] = await Promise.all([
    serverApi<CampaignRow[]>('/api/campaigns'),
    serverApi<TemplateRow[]>('/api/templates'),
    serverApi<SegmentRow[]>('/api/segments'),
  ]);
  return (
    <div>
      <h1>Campaigns</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Send a template to a segment. Suppressions and inactive contacts are always excluded. Stats reconcile live from events.
      </p>
      <CampaignsManager
        initialCampaigns={camps.data ?? []}
        templates={templates.data ?? []}
        segments={segments.data ?? []}
        canWrite={user.permissions.includes('campaigns:write')}
        canDelete={user.permissions.includes('campaigns:delete')}
      />
    </div>
  );
}
