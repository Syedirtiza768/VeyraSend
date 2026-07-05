'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface ContactRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  customFields: Record<string, unknown>;
  createdAt: string;
}

export function ContactsManager({
  initialContacts,
  canWrite,
  canDelete,
}: {
  initialContacts: ContactRow[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  const [email, setEmail] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [csv, setCsv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const r = await api<ContactRow>('POST', '/api/contacts', { email, firstName: first || null, lastName: last || null });
    if (r.data) {
      setContacts((c) => [r.data as ContactRow, ...c]);
      setEmail('');
      setFirst('');
      setLast('');
    } else {
      setError(r.error ?? 'Add failed.');
    }
  }

  async function importCsv(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const r = await api<{ imported: number; skipped: number }>('POST', '/api/contacts/import', { csv });
    if (r.data) {
      setMsg(`Imported ${r.data.imported}, skipped ${r.data.skipped}.`);
      setCsv('');
      const refresh = await api<ContactRow[]>('GET', '/api/contacts');
      if (refresh.data) setContacts(refresh.data);
    } else {
      setError(r.error ?? 'Import failed.');
    }
  }

  async function remove(id: string) {
    const r = await api('DELETE', `/api/contacts/${id}`);
    if (r.status === 204) setContacts((c) => c.filter((x) => x.id !== id));
    else setError(r.error ?? 'Delete failed.');
  }

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={add}>
            <h2 style={{ margin: 0 }}>Add contact</h2>
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>First name</label>
              <input value={first} onChange={(e) => setFirst(e.target.value)} />
            </div>
            <div className="field">
              <label>Last name</label>
              <input value={last} onChange={(e) => setLast(e.target.value)} />
            </div>
            <button className="btn-primary" type="submit">Add</button>
          </form>
        ) : null}

        {canWrite ? (
          <form className="card form" onSubmit={importCsv}>
            <h2 style={{ margin: 0 }}>Import CSV</h2>
            <div className="field">
              <label>CSV (header row required, must include <code>email</code>)</label>
              <textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="email,first_name,last_name,plan&#10;jane@x.com,Jane,Doe,pro" />
            </div>
            <button className="btn-primary" type="submit">Import</button>
          </form>
        ) : null}

        {error ? <div className="form-error">{error}</div> : null}
        {msg ? <div className="caption" style={{ color: 'var(--enxi-color-success-600)' }}>{msg}</div> : null}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Status</th>
              <th>Added</th>
              {canDelete ? <th></th> : null}
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr><td colSpan={canDelete ? 5 : 4} className="caption" style={{ padding: 16 }}>No contacts yet.</td></tr>
            ) : contacts.map((c) => (
              <tr key={c.id}>
                <td><a href={`/contacts/${c.id}`}>{c.email}</a></td>
                <td>{[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}</td>
                <td><span className={`pill pill-${c.status}`}>{c.status}</span></td>
                <td className="caption">{new Date(c.createdAt).toLocaleString()}</td>
                {canDelete ? (
                  <td><button className="btn-ghost" onClick={() => remove(c.id)}>Remove</button></td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
