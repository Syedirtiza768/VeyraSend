'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/client-api';

interface ConversationRow {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  assignedUserId: string | null;
  lastMessageAt: string;
  unread: boolean;
  lastMessagePreview: string | null;
  channels: string[];
}

interface MessageRow {
  id: string;
  channel: string;
  direction: string;
  body: string | null;
  subject: string;
  status: string;
  createdAt: string;
}

interface NoteRow {
  id: string;
  body: string;
  authorUserId: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  contactId: string;
  contact: { id: string; email: string; firstName: string | null; lastName: string | null; phone: string | null };
  assignedUserId: string | null;
  unread: boolean;
  messages: MessageRow[];
  notes: NoteRow[];
}

const CHANNELS = ['', 'email', 'sms', 'voice'] as const;

export function ConversationsManager({ canWrite }: { canWrite: boolean }) {
  const qc = useQueryClient();
  const [channelFilter, setChannelFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyChannel, setReplyChannel] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['conversations', channelFilter, unreadOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelFilter) params.set('channel', channelFilter);
      if (unreadOnly) params.set('unread', 'true');
      const q = params.toString() ? `?${params}` : '';
      const r = await api<ConversationRow[]>('GET', `/api/conversations${q}`);
      if (r.error) throw new Error(r.error);
      return r.data ?? [];
    },
    refetchInterval: 15000,
  });

  const detailQuery = useQuery({
    queryKey: ['conversation', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const r = await api<ConversationDetail>('GET', `/api/conversations/${selectedId}`);
      if (r.error) throw new Error(r.error);
      return r.data ?? null;
    },
    enabled: !!selectedId,
    refetchInterval: 10000,
  });

  const selectConversation = useCallback(async (id: string) => {
    setSelectedId(id);
    setError(null);
    if (canWrite) {
      await api('POST', `/api/conversations/${id}/read`);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, [canWrite, qc]);

  async function sendReply() {
    if (!selectedId || !replyBody.trim()) return;
    setError(null);
    const body: { body: string; channel?: string } = { body: replyBody.trim() };
    if (replyChannel) body.channel = replyChannel;
    const r = await api('POST', `/api/conversations/${selectedId}/messages`, body);
    if (r.error) {
      setError(r.error);
      return;
    }
    setReplyBody('');
    qc.invalidateQueries({ queryKey: ['conversation', selectedId] });
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }

  async function addNote() {
    if (!selectedId || !noteBody.trim()) return;
    setError(null);
    const r = await api('POST', `/api/conversations/${selectedId}/notes`, { body: noteBody.trim() });
    if (r.error) {
      setError(r.error);
      return;
    }
    setNoteBody('');
    qc.invalidateQueries({ queryKey: ['conversation', selectedId] });
  }

  const conversations = listQuery.data ?? [];
  const detail = detailQuery.data;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 2fr)', gap: 16, alignItems: 'start' }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {CHANNELS.map((ch) => (
            <button
              key={ch || 'all'}
              type="button"
              className={channelFilter === ch ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setChannelFilter(ch)}
            >
              {ch || 'All'}
            </button>
          ))}
          <label className="caption" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Unread only
          </label>
        </div>
        {listQuery.isLoading ? <p className="caption">Loading…</p> : null}
        {conversations.length === 0 ? (
          <p className="caption">No conversations yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConversation(c.id)}
                style={{
                  textAlign: 'left',
                  padding: 12,
                  border: selectedId === c.id ? '1px solid var(--enxi-color-accent)' : 'var(--enxi-hairline)',
                  borderRadius: 8,
                  background: c.unread ? 'var(--enxi-color-surface-raised)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{c.contactName}</strong>
                  <span className="caption">{new Date(c.lastMessageAt).toLocaleString()}</span>
                </div>
                <div className="caption">{c.channels.join(', ')} · {c.contactEmail}</div>
                {c.lastMessagePreview ? (
                  <div className="caption" style={{ marginTop: 4, opacity: 0.85 }}>{c.lastMessagePreview.slice(0, 80)}</div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 16, minHeight: 400 }}>
        {!selectedId || !detail ? (
          <p className="caption">Select a conversation to view messages.</p>
        ) : (
          <>
            <div style={{ marginBottom: 16, borderBottom: 'var(--enxi-hairline)', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{detail.contact.firstName ?? detail.contact.email}</h2>
              <div className="caption">
                {detail.contact.email}
                {detail.contact.phone ? ` · ${detail.contact.phone}` : ''}
              </div>
            </div>
            {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}
            <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto', marginBottom: 16 }}>
              {detail.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: 10,
                    borderRadius: 8,
                    background: m.direction === 'outbound' ? 'var(--enxi-color-surface-raised)' : 'transparent',
                    border: 'var(--enxi-hairline)',
                  }}
                >
                  <div className="caption">
                    {m.channel} · {m.direction} · {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{m.body ?? m.subject}</div>
                </div>
              ))}
              {detail.notes.map((n) => (
                <div key={n.id} style={{ padding: 10, borderRadius: 8, border: '1px dashed var(--enxi-color-text-meta)' }}>
                  <div className="caption">Internal note · {new Date(n.createdAt).toLocaleString()}</div>
                  <div style={{ fontSize: 14 }}>{n.body}</div>
                </div>
              ))}
            </div>
            {canWrite ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Reply to contact…"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select className="input" style={{ width: 'auto' }} value={replyChannel} onChange={(e) => setReplyChannel(e.target.value)}>
                    <option value="">Last channel</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                  <button type="button" className="btn btn-primary" onClick={sendReply}>Send reply</button>
                </div>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Internal note (not sent)…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={addNote}>Add note</button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
