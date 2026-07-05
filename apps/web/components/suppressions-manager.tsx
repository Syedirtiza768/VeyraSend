'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface SuppressionRow { id: string; email: string; reason: string; source: string; createdAt: string }

export function SuppressionsManager({ initialSuppressions, canWrite }: { initialSuppressions: SuppressionRow[]; canWrite: boolean }) {
  const [rows, setRows] = useState<SuppressionRow[]>(initialSuppressions);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('manual');
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api<SuppressionRow>('POST', '/api/suppressions', { email, reason });
    if (r.data) {
      setRows((s) => [r.data as SuppressionRow, ...s]);
      setEmail('');
    } else setError(r.error ?? 'Add failed.');
  }

  async function remove(id: string) {
    const r = await api('DELETE', `/api/suppressions/${id}`);
    if (r.status === 204) setRows((s) => s.filter((x) => x.id !== id));
    else setError(r.error ?? 'Remove failed.');
  }

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={add}>
            <h2 style={{ margin: 0 }}>Add suppression</h2>
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Reason</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="manual">manual</option>
                <option value="unsubscribe">unsubscribe</option>
                <option value="bounce">bounce</option>
                <option value="complaint">complaint</option>
              </select>
            </div>
            <button className="btn-primary" type="submit">Add</button>
          </form>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Email</th><th>Reason</th><th>Source</th><th>Created</th>{canWrite ? <th></th> : null}</tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={canWrite ? 5 : 4} className="caption" style={{ padding: 16 }}>No suppressions.</td></tr>
            ) : rows.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td><span className={`pill pill-${s.reason}`}>{s.reason}</span></td>
                <td className="caption">{s.source}</td>
                <td className="caption">{new Date(s.createdAt).toLocaleString()}</td>
                {canWrite ? <td><button className="btn-ghost" onClick={() => remove(s.id)}>Remove</button></td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
