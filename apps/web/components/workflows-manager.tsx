'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface WorkflowDefinition {
  trigger: { type: string; config?: Record<string, unknown> };
  steps: Array<{ type: string; [k: string]: unknown }>;
}

interface WorkflowRow {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'paused' | 'archived';
  currentVersionId: string | null;
  draftVersion: { id: string; version: number; definition: WorkflowDefinition } | null;
  publishedVersion: { id: string; version: number; definition: WorkflowDefinition } | null;
  createdAt: string;
}

interface RunRow {
  id: string;
  status: string;
  dryRun: boolean;
  contactId: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface StepRow {
  nodeId: string;
  status: string;
  detail: Record<string, unknown> | null;
  error: string | null;
}

const DEFAULT_DEF = JSON.stringify({
  trigger: { type: 'contact.created' },
  steps: [
    { type: 'send_email', templateId: 'PASTE_TEMPLATE_ID', fromEmail: 'welcome@yourdomain.com' },
    { type: 'delay', durationSeconds: 86400 },
    { type: 'send_email', templateId: 'PASTE_TEMPLATE_ID', fromEmail: 'welcome@yourdomain.com' },
  ],
}, null, 2);

export function WorkflowsManager({
  initialWorkflows,
  canWrite,
  canPublish,
}: {
  initialWorkflows: WorkflowRow[];
  canWrite: boolean;
  canPublish: boolean;
}) {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>(initialWorkflows);
  const [name, setName] = useState('Welcome sequence');
  const [defJson, setDefJson] = useState(DEFAULT_DEF);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [testContactId, setTestContactId] = useState('');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let definition: unknown;
    try { definition = JSON.parse(defJson); } catch { setError('Definition is not valid JSON.'); return; }
    const r = await api<WorkflowRow>('POST', '/api/workflows', { name, definition });
    if (r.data) setWorkflows((w) => [r.data as WorkflowRow, ...w]);
    else setError(r.error ?? 'Create failed.');
  }

  async function publish(id: string) {
    const r = await api<WorkflowRow>('POST', `/api/workflows/${id}/publish`);
    if (r.data) setWorkflows((list) => list.map((x) => (x.id === id ? (r.data as WorkflowRow) : x)));
    else setError(r.error ?? 'Publish failed.');
  }

  async function togglePause(w: WorkflowRow) {
    const path = w.status === 'paused' ? 'resume' : 'pause';
    const r = await api<WorkflowRow>('POST', `/api/workflows/${w.id}/${path}`);
    if (r.data) setWorkflows((list) => list.map((x) => (x.id === w.id ? (r.data as WorkflowRow) : x)));
    else setError(r.error ?? 'Status change failed.');
  }

  async function loadRuns(id: string) {
    setSelectedId(id);
    const r = await api<RunRow[]>('GET', `/api/workflows/${id}/runs`);
    setRuns(r.data ?? []);
    setSteps([]);
  }

  async function loadSteps(runId: string) {
    const r = await api<StepRow[]>('GET', `/api/workflows/runs/${runId}/steps`);
    setSteps(r.data ?? []);
  }

  async function testRun(id: string) {
    if (!testContactId.trim()) { setError('Enter a contact id for test-run.'); return; }
    const r = await api<{ runIds: string[] }>('POST', `/api/workflows/${id}/test-run`, { contactId: testContactId.trim() });
    if (r.data?.runIds?.[0]) {
      await loadRuns(id);
      await loadSteps(r.data.runIds[0]);
    } else setError(r.error ?? 'Test run failed.');
  }

  const def = (w: WorkflowRow) => w.draftVersion?.definition ?? w.publishedVersion?.definition;

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={create}>
            <h2 style={{ margin: 0 }}>New workflow</h2>
            <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="field"><label>Definition (JSON)</label><textarea rows={14} value={defJson} onChange={(e) => setDefJson(e.target.value)} /></div>
            <button className="btn-primary" type="submit">Create draft</button>
          </form>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {workflows.length === 0 ? (
          <div className="card caption" style={{ padding: 16 }}>No workflows yet.</div>
        ) : workflows.map((w) => (
          <div className="card" key={w.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                {w.name}{' '}
                <span className={`pill pill-${w.status === 'published' ? 'ok' : 'pending'}`}>{w.status}</span>
              </h3>
              <div className="row-actions">
                {canPublish && w.status !== 'published' ? (
                  <button className="btn-ghost" onClick={() => publish(w.id)}>Publish</button>
                ) : null}
                {canWrite && (w.status === 'published' || w.status === 'paused') ? (
                  <button className="btn-ghost" onClick={() => togglePause(w)}>{w.status === 'paused' ? 'Resume' : 'Pause'}</button>
                ) : null}
                <button className="btn-ghost" onClick={() => loadRuns(w.id)}>Runs</button>
              </div>
            </div>
            {def(w) ? (
              <div className="caption" style={{ marginTop: 6 }}>
                Trigger: {def(w)!.trigger.type} · {def(w)!.steps?.length ?? 0} step(s):{' '}
                {(def(w)!.steps ?? []).map((s) => s.type).join(' → ')}
              </div>
            ) : null}
            {selectedId === w.id ? (
              <div style={{ marginTop: 12 }}>
                {canWrite ? (
                  <div className="field" style={{ marginBottom: 8 }}>
                    <label>Test-run contact id</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={testContactId} onChange={(e) => setTestContactId(e.target.value)} placeholder="contact uuid" />
                      <button type="button" className="btn-ghost" onClick={() => testRun(w.id)}>Dry run</button>
                    </div>
                  </div>
                ) : null}
                {runs.length === 0 ? (
                  <div className="caption">No runs yet.</div>
                ) : (
                  <ul className="caption" style={{ margin: 0, paddingLeft: 18 }}>
                    {runs.map((r) => (
                      <li key={r.id}>
                        <button type="button" className="btn-link" onClick={() => loadSteps(r.id)}>
                          {r.status}{r.dryRun ? ' (dry)' : ''} · {r.startedAt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {steps.length > 0 ? (
                  <pre className="caption" style={{ marginTop: 8, overflow: 'auto' }}>{JSON.stringify(steps, null, 2)}</pre>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
