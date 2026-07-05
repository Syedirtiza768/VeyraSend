import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface PageRow { id: string; name: string; slug: string; published: boolean }

export default async function FunnelsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const pages = (await serverApi<PageRow[]>('/api/funnels/pages')).data ?? [];
  return (
    <div>
      <h1>Funnels & pages</h1>
      <p className="meta">Public pages: <code>/f/[slug]</code></p>
      <div className="card" style={{ marginTop: 16 }}>
        {pages.length === 0 ? <p className="caption">No landing pages yet.</p> : pages.map((p) => (
          <div key={p.id}>{p.name} — <code>{p.slug}</code> {p.published ? '(published)' : '(draft)'}</div>
        ))}
      </div>
    </div>
  );
}
