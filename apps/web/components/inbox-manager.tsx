'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface ThreadRow {
  id: string; fromEmail: string; toEmail: string; subject: string;
  messageCount: number; lastInboundAt: string; createdAt: string;
}
interface MessageRow {
  id: string; fromEmail: string; subject: string; text: string | null;
  html: string | null; receivedAt: string;
}

export function InboxManager({ initialThreads }: { initialThreads: ThreadRow[] }) {
  const [threads] = useState<ThreadRow[]>(initialThreads);
  const [open, setOpen] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, MessageRow[]>>({});
  const [error, setError] = useState<string | null>(null);

  async function openThread(id: string) {
    if (open === id) { setOpen(null); return; }
    setOpen(id);
    if (!messages[id]) {
      const r = await api<MessageRow[]>('GET', `/api/inbound/threads/${id}/messages`);
      if (r.data) setMessages((m) => ({ ...m, [id]: r.data as MessageRow[] }));
      else setError(r.error ?? 'Failed to load thread.');
    }
  }

  if (threads.length === 0) {
    return <div className="card caption" style={{ padding: 16 }}>No inbound replies yet.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error ? <div className="form-error">{error}</div> : null}
      {threads.map((t) => (
        <div className="card" key={t.id} style={{ cursor: 'pointer' }} >
          <div onClick={() => openThread(t.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{t.fromEmail}</strong>
              <span className="caption">{new Date(t.lastInboundAt).toLocaleString()}</span>
            </div>
            <div className="caption">{t.subject} · {t.messageCount} message{t.messageCount === 1 ? '' : 's'}</div>
          </div>
          {open === t.id && messages[t.id] ? (
            <div style={{ marginTop: 12, borderTop: 'var(--enxi-hairline)', paddingTop: 12, display: 'grid', gap: 12 }}>
              {messages[t.id]!.map((m) => (
                <div key={m.id}>
                  <div className="caption">{new Date(m.receivedAt).toLocaleString()} — {m.subject}</div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{m.text ?? '(no text body)'}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
