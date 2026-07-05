'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface SenderRow {
  id: string;
  fromEmail: string;
  fromName: string | null;
  replyTo: string;
  nickname: string | null;
  verified: boolean;
  verificationStatus: string;
  createdAt: string;
}

interface Status {
  provisioned: boolean;
  region: string | null;
  subuserUsername: string | null;
  provisionedAt: string | null;
}

interface Props {
  initialStatus: Status;
  initialSenders: SenderRow[];
  canWrite: boolean;
  canProvision: boolean;
}

export function SendersManager({ initialStatus, initialSenders, canWrite, canProvision }: Props) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [senders, setSenders] = useState<SenderRow[]>(initialSenders);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [nickname, setNickname] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function provision() {
    setBusy(true);
    setError(null);
    const res = await api<Status>('POST', '/api/sendgrid/provision');
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.error ?? 'Provision failed.');
      return;
    }
    setStatus(res.data);
  }

  async function createSender(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api<{ data: SenderRow }>('POST', '/api/senders', {
      fromEmail: email,
      fromName: name || undefined,
      replyTo: replyTo || email,
      nickname: nickname || undefined,
      address: '1 Market St',
      city: 'San Francisco',
      country: 'US',
      company: company || undefined,
    });
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.error ?? 'Create failed.');
      return;
    }
    setSenders((prev) => [...prev, res.data!.data]);
    setEmail('');
    setName('');
    setReplyTo('');
    setNickname('');
    setCompany('');
  }

  async function remove(id: string) {
    const res = await api('DELETE', `/api/senders/${id}`);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSenders((prev) => prev.filter((s) => s.id !== id));
  }

  async function resend(id: string) {
    await api('POST', `/api/senders/${id}/resend-verification`);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h2>SendGrid subuser</h2>
        {status.provisioned ? (
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Provisioned · region <code>{status.region}</code> · subuser <code>{status.subuserUsername}</code>
          </p>
        ) : canProvision ? (
          <>
            <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: '0 0 12px' }}>
              Not provisioned. Provisions a dedicated SendGrid subuser for this tenant (ADR-0001).
            </p>
            <button className="btn-primary" onClick={provision} disabled={busy}>
              {busy ? 'Provisioning…' : 'Provision subuser'}
            </button>
          </>
        ) : (
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Not provisioned. Ask an owner to provision the SendGrid subuser.
          </p>
        )}
      </div>

      <div className="users-grid">
        <div className="card">
          <h2>Senders</h2>
          <table className="status">
            <thead>
              <tr>
                <th>From</th>
                <th>Reply-to</th>
                <th>Status</th>
                {canWrite ? <th className="status-pill"></th> : null}
              </tr>
            </thead>
            <tbody>
              {senders.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.fromEmail}
                    {s.fromName ? <div className="meta">{s.fromName}</div> : null}
                  </td>
                  <td className="meta">{s.replyTo}</td>
                  <td className="status-pill">
                    <span className={s.verified ? 'pill ok' : 'pill pending'}>{s.verificationStatus}</span>
                  </td>
                  <td className="status-pill">
                    {canWrite && status.provisioned ? (
                      <span className="row-actions">
                        <button className="btn-ghost" onClick={() => resend(s.id)}>
                          Resend
                        </button>
                        <button className="btn-ghost" onClick={() => remove(s.id)}>
                          Delete
                        </button>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {senders.length === 0 ? (
                <tr>
                  <td className="meta" colSpan={4}>
                    No senders yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {canWrite && status.provisioned ? (
          <div className="card">
            <h2>Add sender</h2>
            <form className="form" onSubmit={createSender}>
              <label className="field">
                <span className="caption">From email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="field">
                <span className="caption">From name</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                <span className="caption">Reply-to</span>
                <input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder={email} />
              </label>
              <label className="field">
                <span className="caption">Company</span>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
              </label>
              {error ? <div className="form-error">{error}</div> : null}
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'Adding…' : 'Add sender'}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
