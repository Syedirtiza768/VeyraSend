'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface TemplateRow {
  id: string; name: string; subject: string; html: string; text: string | null;
  generation: string; variables: { key: string }[]; version: number; createdAt: string;
}
interface Preview { subject: string; html: string; text: string | null }

export function TemplatesManager({ initialTemplates, canWrite, canDelete }: { initialTemplates: TemplateRow[]; canWrite: boolean; canDelete: boolean }) {
  const [templates, setTemplates] = useState<TemplateRow[]>(initialTemplates);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Hello {{first_name}}');
  const [html, setHtml] = useState('<p>Hi {{first_name}}, welcome!</p>');
  const [varsJson, setVarsJson] = useState('[{"key":"first_name","fallback":"there"}]');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, Preview>>({});
  const [previewVars, setPreviewVars] = useState('{"first_name":"Jane"}');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let variables: { key: string }[];
    try { variables = JSON.parse(varsJson); } catch { setError('Variables must be valid JSON.'); return; }
    const r = await api<TemplateRow>('POST', '/api/templates', { name, subject, html, variables });
    if (r.data) { setTemplates((t) => [r.data as TemplateRow, ...t]); setName(''); }
    else setError(r.error ?? 'Create failed.');
  }

  async function doPreview(id: string) {
    let vars: Record<string, unknown> = {};
    try { vars = JSON.parse(previewVars); } catch { setError('Preview vars must be valid JSON.'); return; }
    const r = await api<Preview>('POST', `/api/templates/${id}/preview`, { vars });
    if (r.data) setPreview((m) => ({ ...m, [id]: r.data as Preview }));
    else setError(r.error ?? 'Preview failed.');
  }

  async function testSend(id: string) {
    let vars: Record<string, unknown> = {};
    try { vars = JSON.parse(previewVars); } catch { setError('Preview vars must be valid JSON.'); return; }
    const r = await api<{ messageId: string }>('POST', `/api/templates/${id}/test-send`, { toEmail: 'test@example.com', vars });
    if (!r.data) setError(r.error ?? 'Test send failed.');
  }

  async function remove(id: string) {
    const r = await api('DELETE', `/api/templates/${id}`);
    if (r.status === 204) setTemplates((t) => t.filter((x) => x.id !== id));
    else setError(r.error ?? 'Delete failed.');
  }

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={create}>
            <h2 style={{ margin: 0 }}>New template</h2>
            <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="field"><label>Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="field"><label>HTML</label><textarea rows={6} value={html} onChange={(e) => setHtml(e.target.value)} /></div>
            <div className="field"><label>Variables (JSON)</label><textarea rows={4} value={varsJson} onChange={(e) => setVarsJson(e.target.value)} /></div>
            <button className="btn-primary" type="submit">Create</button>
          </form>
        ) : null}
        <div className="card form">
          <h2 style={{ margin: 0 }}>Preview vars</h2>
          <div className="field"><textarea rows={3} value={previewVars} onChange={(e) => setPreviewVars(e.target.value)} /></div>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {templates.length === 0 ? (
          <div className="card caption" style={{ padding: 16 }}>No templates yet.</div>
        ) : templates.map((t) => (
          <div className="card" key={t.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{t.name} <span className="caption">v{t.version}</span></h3>
              <div className="row-actions">
                <button className="btn-ghost" onClick={() => doPreview(t.id)}>Preview</button>
                {canWrite ? <button className="btn-ghost" onClick={() => testSend(t.id)}>Test send</button> : null}
                {canDelete ? <button className="btn-ghost" onClick={() => remove(t.id)}>Delete</button> : null}
              </div>
            </div>
            <div className="caption" style={{ marginTop: 6 }}>{t.subject}</div>
            <div className="caption">Vars: {t.variables.map((v) => v.key).join(', ') || '—'}</div>
            {preview[t.id] ? (
              <div style={{ marginTop: 10, borderTop: 'var(--enxi-hairline)', paddingTop: 10 }}>
                <div className="caption"><strong>Subject:</strong> {preview[t.id]!.subject}</div>
                <iframe srcDoc={preview[t.id]!.html} style={{ width: '100%', height: 180, border: 'var(--enxi-hairline)', borderRadius: 8, marginTop: 8 }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
