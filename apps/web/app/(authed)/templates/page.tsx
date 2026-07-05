import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { TemplatesManager } from '../../../components/templates-manager';

interface TemplateRow {
  id: string; name: string; subject: string; html: string; text: string | null;
  generation: string; variables: { key: string }[]; version: number; createdAt: string;
}

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('templates:read')) {
    return (
      <div>
        <h1>Templates</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>templates:read</code>.
          </p>
        </div>
      </div>
    );
  }
  const res = await serverApi<TemplateRow[]>('/api/templates');
  return (
    <div>
      <h1>Templates</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Versioned HTML templates with <code>{'{{variable}}'}</code> placeholders. Preview with sample data, then test-send.
      </p>
      <TemplatesManager initialTemplates={res.data ?? []} canWrite={user.permissions.includes('templates:write')} canDelete={user.permissions.includes('templates:delete')} />
    </div>
  );
}
