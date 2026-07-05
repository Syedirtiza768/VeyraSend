import { getCurrentUser, serverApi } from '../../../../lib/server-api';

export default async function AgencyBrandingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const branding = (await serverApi<Record<string, string | null>>('/api/agency/branding')).data ?? {};
  return (
    <div>
      <h1>Agency branding</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <pre style={{ margin: 0, fontSize: 13 }}>{JSON.stringify(branding, null, 2)}</pre>
      </div>
    </div>
  );
}
