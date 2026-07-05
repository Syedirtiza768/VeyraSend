'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface SegmentDef { combinator: 'and' | 'or'; rules: { field: string; op: string; value: string }[] }
interface SegmentRow { id: string; name: string; definition: SegmentDef; createdAt: string }
interface EvalResult { count: number; sample: { id: string; email: string; status: string }[] }

const DEFAULT_DEF = '{"combinator":"and","rules":[{"field":"email","op":"domain_eq","value":"example.com"}]}';

export function SegmentsManager({ initialSegments, canWrite, canDelete }: { initialSegments: SegmentRow[]; canWrite: boolean; canDelete: boolean }) {
  const [segments, setSegments] = useState<SegmentRow[]>(initialSegments);
  const [name, setName] = useState('');
  const [defJson, setDefJson] = useState(DEFAULT_DEF);
  const [error, setError] = useState<string | null>(null);
  const [evals, setEvals] = useState<Record<string, EvalResult | undefined>>({});

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let def: SegmentDef;
    try {
      def = JSON.parse(defJson);
    } catch {
      setError('Definition is not valid JSON.');
      return;
    }
    const r = await api<SegmentRow>('POST', '/api/segments', { name, definition: def });
    if (r.data) {
      setSegments((s) => [r.data as SegmentRow, ...s]);
      setName('');
    } else setError(r.error ?? 'Create failed.');
  }

  async function evaluate(id: string) {
    const r = await api<EvalResult>('GET', `/api/segments/${id}/evaluate`);
    if (r.data) setEvals((m) => ({ ...m, [id]: r.data as EvalResult }));
    else setError(r.error ?? 'Evaluate failed.');
  }

  async function remove(id: string) {
    const r = await api('DELETE', `/api/segments/${id}`);
    if (r.status === 204) setSegments((s) => s.filter((x) => x.id !== id));
    else setError(r.error ?? 'Delete failed.');
  }

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={create}>
            <h2 style={{ margin: 0 }}>New segment</h2>
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Definition (JSON)</label>
              <textarea rows={6} value={defJson} onChange={(e) => setDefJson(e.target.value)} />
            </div>
            <button className="btn-primary" type="submit">Create</button>
          </form>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {segments.length === 0 ? (
          <div className="card caption" style={{ padding: 16 }}>No segments yet.</div>
        ) : segments.map((s) => (
          <div className="card" key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{s.name}</h3>
              <div className="row-actions">
                <button className="btn-ghost" onClick={() => evaluate(s.id)}>Evaluate</button>
                {canDelete ? <button className="btn-ghost" onClick={() => remove(s.id)}>Delete</button> : null}
              </div>
            </div>
            <pre className="caption" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(s.definition)}</pre>
            {evals[s.id] ? (
              <div style={{ marginTop: 8 }}>
                <div className="caption">Matches: <strong>{evals[s.id]!.count}</strong></div>
                {evals[s.id]!.sample.slice(0, 5).map((c) => (
                  <div key={c.id} className="caption">{c.email} · {c.status}</div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
