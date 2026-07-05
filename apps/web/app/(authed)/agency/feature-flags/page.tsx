import { getCurrentUser, serverApi } from '../../../../lib/server-api';

interface FlagRow { key: string; enabled: boolean; source: string }

export default async function AgencyFeatureFlagsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const flags = (await serverApi<FlagRow[]>('/api/agency/feature-flags')).data ?? [];
  return (
    <div>
      <h1>Feature flags</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <ul>
          {flags.map((f) => (
            <li key={f.key}>{f.key}: {f.enabled ? 'on' : 'off'} ({f.source})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
