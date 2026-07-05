'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface MessageRow {
  id: string;
  kind: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  status: string;
  sgMessageId: string | null;
  reason: string | null;
  createdAt: string;
}

export function MessagesManager({
  initialMessages,
  provisioned,
  canWrite,
}: {
  initialMessages: MessageRow[];
  provisioned: boolean;
  canWrite: boolean;
}) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const r = await api<MessageRow>('POST', '/api/messages/send', {
      fromEmail: from,
      toEmail: to,
      subject,
      html,
    });
    setSending(false);
    if (r.data) {
      setMessages((m) => [r.data as MessageRow, ...m]);
      setTo('');
      setSubject('');
      setHtml('');
    } else {
      setError(r.error ?? 'Send failed.');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {!provisioned ? (
        <div className="card">
          <p className="body-sm" style={{ margin: 0 }}>
            SendGrid is not provisioned for this tenant. Provision a subuser on the Senders or Domains
            page before sending.
          </p>
        </div>
      ) : null}

      {canWrite ? (
        <form className="card" onSubmit={send} style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0 }}>New transactional email</h2>
          <div className="field">
            <label>From</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="you@yourdomain.com" required />
          </div>
          <div className="field">
            <label>To</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" required />
          </div>
          <div className="field">
            <label>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="field">
            <label>HTML body</label>
            <textarea rows={5} value={html} onChange={(e) => setHtml(e.target.value)} />
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <div>
            <button className="btn-primary" type="submit" disabled={sending || !provisioned}>
              {sending ? 'Queuing…' : 'Send'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>To</th>
              <th>Subject</th>
              <th>From</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="caption" style={{ padding: 16 }}>
                  No messages yet.
                </td>
              </tr>
            ) : (
              messages.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className={`pill pill-${m.status}`}>{m.status}</span>
                  </td>
                  <td>{m.toEmail}</td>
                  <td>{m.subject}</td>
                  <td>{m.fromEmail}</td>
                  <td className="caption">{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
