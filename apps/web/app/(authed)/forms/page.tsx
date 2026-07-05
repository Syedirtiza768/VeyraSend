import { getCurrentUser, serverApi } from '../../../lib/server-api';

interface FormRow { id: string; name: string; fields: { label: string; fieldKey: string }[] }

export default async function FormsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const res = await serverApi<FormRow[]>('/api/forms');
  const forms = res.data ?? [];
  return (
    <div>
      <h1>Forms</h1>
      <div className="card" style={{ marginTop: 16 }}>
        {forms.length === 0 ? <p className="caption">No forms yet.</p> : forms.map((f) => (
          <div key={f.id} style={{ marginBottom: 12 }}>
            <strong>{f.name}</strong> — {f.fields.length} field(s)
          </div>
        ))}
      </div>
    </div>
  );
}
