'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface Settings {
  webhookVerificationKey: string | null;
  eventRetentionDays: number;
  messageRetentionDays: number;
  inboundRetentionDays: number;
  updatedAt: string;
}

export function SettingsManager({ initial, canWrite }: { initial: Settings | null; canWrite: boolean }) {
  const [event, setEvent] = useState(initial?.eventRetentionDays ?? 90);
  const [message, setMessage] = useState(initial?.messageRetentionDays ?? 365);
  const [inbound, setInbound] = useState(initial?.inboundRetentionDays ?? 90);
  const [webhookKey, setWebhookKey] = useState(initial?.webhookVerificationKey ?? '');
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(null);
    const r = await api<Settings>('PUT', '/api/settings', {
      eventRetentionDays: event,
      messageRetentionDays: message,
      inboundRetentionDays: inbound,
      webhookVerificationKey: webhookKey || null,
    });
    if (r.data) setSaved('Settings saved.');
    else setError(r.error ?? 'Save failed.');
  }

  if (!initial) return <div className="card caption" style={{ padding: 16 }}>No settings available.</div>;

  return (
    <form className="card form" onSubmit={save} style={{ maxWidth: 560 }}>
      <div className="field">
        <label>Event webhook verification key (optional)</label>
        <input value={webhookKey} onChange={(e) => setWebhookKey(e.target.value)} placeholder="SendGrid event webhook public key" disabled={!canWrite} />
      </div>
      <div className="field"><label>Event retention (days)</label><input type="number" min={1} value={event} onChange={(e) => setEvent(Number(e.target.value))} disabled={!canWrite} /></div>
      <div className="field"><label>Message retention (days)</label><input type="number" min={1} value={message} onChange={(e) => setMessage(Number(e.target.value))} disabled={!canWrite} /></div>
      <div className="field"><label>Inbound message retention (days)</label><input type="number" min={1} value={inbound} onChange={(e) => setInbound(Number(e.target.value))} disabled={!canWrite} /></div>
      {canWrite ? <button className="btn-primary" type="submit">Save</button> : null}
      {saved ? <div className="form-success">{saved}</div> : null}
      {error ? <div className="form-error">{error}</div> : null}
    </form>
  );
}
