'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface UsersRow {
  userId: string;
  email: string;
  name: string | null;
  roleName: string;
  createdAt: string;
}

interface RoleRow {
  id: string;
  name: string;
  isSystem: boolean;
}

interface Props {
  initialUsers: UsersRow[];
  roles: RoleRow[];
  canWrite: boolean;
  selfId: string;
}

export function UsersManager({ initialUsers, roles, canWrite, selfId }: Props) {
  const [users, setUsers] = useState<UsersRow[]>(initialUsers);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState(roles.find((r) => r.name === 'member')?.name ?? roles[0]?.name ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const res = await api<{ data: UsersRow }>('POST', '/api/users', {
      email,
      password,
      name: name || null,
      roleName,
    });
    setBusy(false);
    if (res.error || !res.data) {
      setFormError(res.error ?? 'Create failed.');
      return;
    }
    setUsers((prev) => [...prev, res.data!.data]);
    setEmail('');
    setName('');
    setPassword('');
  }

  async function saveRole(userId: string) {
    const res = await api<{ data: UsersRow }>('PATCH', `/api/users/${userId}`, { roleName: editRole });
    if (res.error || !res.data) {
      setFormError(res.error ?? 'Update failed.');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.userId === userId ? res.data!.data : u)));
    setEditingId(null);
  }

  return (
    <div className="users-grid">
      <div className="card">
        <h2>Members</h2>
        <table className="status">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              {canWrite ? <th className="status-pill"></th> : null}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId}>
                <td>{u.email}</td>
                <td className="meta">{u.name ?? '—'}</td>
                <td>
                  {editingId === u.userId ? (
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="pill">{u.roleName}</span>
                  )}
                </td>
                <td className="meta enxi-num">{new Date(u.createdAt).toISOString().slice(0, 10)}</td>
                <td className="status-pill">
                  {canWrite && u.userId !== selfId ? (
                    editingId === u.userId ? (
                      <span className="row-actions">
                        <button className="btn-ghost" onClick={() => saveRole(u.userId)}>
                          Save
                        </button>
                        <button className="btn-ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setEditingId(u.userId);
                          setEditRole(u.roleName);
                        }}
                      >
                        Edit role
                      </button>
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canWrite ? (
        <div className="card">
          <h2>Add member</h2>
          <form className="form" onSubmit={createUser}>
            <label className="field">
              <span className="caption">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="field">
              <span className="caption">Name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span className="caption">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={10}
                required
              />
            </label>
            <label className="field">
              <span className="caption">Role</span>
              <select value={roleName} onChange={(e) => setRoleName(e.target.value)}>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            {formError ? <div className="form-error">{formError}</div> : null}
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Adding…' : 'Add member'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
