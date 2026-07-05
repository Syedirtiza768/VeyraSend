'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface ListRow { id: string; name: string; memberCount: number; createdAt: string }

export function ListsManager({ initialLists, canWrite, canDelete }: { initialLists: ListRow[]; canWrite: boolean; canDelete: boolean }) {
  const [lists, setLists] = useState<ListRow[]>(initialLists);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api<ListRow>('POST', '/api/lists', { name });
    if (r.data) {
      setLists((l) => [r.data as ListRow, ...l]);
      setName('');
    } else setError(r.error ?? 'Create failed.');
  }

  async function remove(id: string) {
    const r = await api('DELETE', `/api/lists/${id}`);
    if (r.status === 204) setLists((l) => l.filter((x) => x.id !== id));
    else setError(r.error ?? 'Delete failed.');
  }

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={create}>
            <h2 style={{ margin: 0 }}>New list</h2>
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit">Create</button>
          </form>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Members</th><th>Created</th>{canDelete ? <th></th> : null}</tr></thead>
          <tbody>
            {lists.length === 0 ? (
              <tr><td colSpan={canDelete ? 4 : 3} className="caption" style={{ padding: 16 }}>No lists yet.</td></tr>
            ) : lists.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.memberCount}</td>
                <td className="caption">{new Date(l.createdAt).toLocaleString()}</td>
                {canDelete ? <td><button className="btn-ghost" onClick={() => remove(l.id)}>Delete</button></td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
