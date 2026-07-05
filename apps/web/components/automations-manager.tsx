'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface AutomationRow {
  id: string; name: string; status: 'active' | 'paused';
  definition: { trigger: { event: string }; steps: { type: string }[] };
  createdAt: string;
}

const DEFAULT_DEF = JSON.stringify({
  trigger: { event: 'contact.created' },
  steps: [
    { type: 'send', templateId: 'PASTE_TEMPLATE_ID', fromEmail: 'welcome@yourdomain.com' },
    { type: 'delay', durationMs: 86400000 },
    { type: 'send', templateId: 'PASTE_TEMPLATE_ID', fromEmail: 'welcome@yourdomain.com' },
  ],
}, null, 2);

export function AutomationsManager({ initialAutomations, canWrite, canDelete }: { initialAutomations: AutomationRow[]; canWrite: boolean; canDelete: boolean }) {
  const [autos, setAutos] = useState<AutomationRow[]>(initialAutomations);
  const [name, setName] = useState('Welcome sequence');
  const [defJson, setDefJson] = useState(DEFAULT_DEF);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let definition: unknown;
    try { definition = JSON.parse(defJson); } catch { setError('Definition is not valid JSON.'); return; }
    const r = await api<AutomationRow>('POST', '/api/automations', { name, definition });
    if (r.data) setAutos((a) => [r.data as AutomationRow, ...a]);
    else setError(r.error ?? 'Create failed.');
  }

  async function toggle(a: AutomationRow) {
    const next = a.status === 'active' ? 'paused' : 'active';
    const r = await api<AutomationRow>('POST', `/api/automations/${a.id}/status`, { status: next });
    if (r.data) setAutos((list) => list.map((x) => (x.id === a.id ? (r.data as AutomationRow) : x)));
    else setError(r.error ?? 'Status change failed.');
  }

  async function remove(id: string) {
    const r = await api('DELETE', `/api/automations/${id}`);
    if (r.status === 204) setAutos((a) => a.filter((x) => x.id !== id));
    else setError(r.error ?? 'Delete failed.');
  }

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={create}>
            <h2 style={{ margin: 0 }}>New automation</h2>
            <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="field"><label>Definition (JSON)</label><textarea rows={12} value={defJson} onChange={(e) => setDefJson(e.target.value)} /></div>
            <button className="btn-primary" type="submit">Create (paused)</button>
          </form>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {autos.length === 0 ? (
          <div className="card caption" style={{ padding: 16 }}>No automations yet.</div>
        ) : autos.map((a) => (
          <div className="card" key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{a.name} <span className={`pill pill-${a.status === 'active' ? 'ok' : 'pending'}`}>{a.status}</span></h3>
              <div className="row-actions">
                {canWrite ? <button className="btn-ghost" onClick={() => toggle(a)}>{a.status === 'active' ? 'Pause' : 'Activate'}</button> : null}
                {canDelete ? <button className="btn-ghost" onClick={() => remove(a.id)}>Delete</button> : null}
              </div>
            </div>
            <div className="caption" style={{ marginTop: 6 }}>Trigger: {a.definition.trigger.event} · {a.definition.steps.length} step(s): {a.definition.steps.map((s) => s.type).join(' → ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
