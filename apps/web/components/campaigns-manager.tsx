'use client';

import { useState } from 'react';
import { api } from '../lib/client-api';

interface CampaignRow {
  id: string; name: string; templateId: string; segmentId: string; fromEmail: string;
  status: string; scheduledAt: string | null; recipients: number; createdAt: string;
}
interface TemplateRow { id: string; name: string }
interface SegmentRow { id: string; name: string }
interface Stats {
  recipients: number; sent: number; delivered: number; bounced: number; failed: number;
  opens: number; clicks: number; unsubscribes: number;
}

export function CampaignsManager({
  initialCampaigns, templates, segments, canWrite, canDelete,
}: {
  initialCampaigns: CampaignRow[];
  templates: TemplateRow[];
  segments: SegmentRow[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(initialCampaigns);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [segmentId, setSegmentId] = useState(segments[0]?.id ?? '');
  const [fromEmail, setFromEmail] = useState('news@yourdomain.com');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api<CampaignRow>('POST', '/api/campaigns', { name, templateId, segmentId, fromEmail });
    if (r.data) { setCampaigns((c) => [r.data as CampaignRow, ...c]); setName(''); }
    else setError(r.error ?? 'Create failed.');
  }

  async function send(id: string) {
    setBusy(id);
    const r = await api<CampaignRow>('POST', `/api/campaigns/${id}/send`);
    setBusy(null);
    if (r.data) setCampaigns((c) => c.map((x) => (x.id === id ? (r.data as CampaignRow) : x)));
    else setError(r.error ?? 'Send failed.');
  }

  async function loadStats(id: string) {
    const r = await api<Stats>('GET', `/api/campaigns/${id}/stats`);
    if (r.data) setStats((m) => ({ ...m, [id]: r.data as Stats }));
    else setError(r.error ?? 'Stats failed.');
  }

  async function remove(id: string) {
    const r = await api('DELETE', `/api/campaigns/${id}`);
    if (r.status === 204) setCampaigns((c) => c.filter((x) => x.id !== id));
    else setError(r.error ?? 'Delete failed.');
  }

  const tmplName = (id: string) => templates.find((t) => t.id === id)?.name ?? id;
  const segName = (id: string) => segments.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        {canWrite ? (
          <form className="card form" onSubmit={create}>
            <h2 style={{ margin: 0 }}>New campaign</h2>
            <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="field"><label>Template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Segment</label>
              <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="field"><label>From email</label><input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} required /></div>
            <button className="btn-primary" type="submit">Create</button>
          </form>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {campaigns.length === 0 ? (
          <div className="card caption" style={{ padding: 16 }}>No campaigns yet.</div>
        ) : campaigns.map((c) => (
          <div className="card" key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{c.name} <span className={`pill pill-${c.status}`}>{c.status}</span></h3>
              <div className="row-actions">
                {canWrite && c.status !== 'sent' ? <button className="btn-ghost" disabled={busy === c.id} onClick={() => send(c.id)}>{busy === c.id ? 'Sending…' : 'Send now'}</button> : null}
                <button className="btn-ghost" onClick={() => loadStats(c.id)}>Stats</button>
                {canDelete ? <button className="btn-ghost" onClick={() => remove(c.id)}>Delete</button> : null}
              </div>
            </div>
            <div className="caption" style={{ marginTop: 6 }}>Template: {tmplName(c.templateId)} · Segment: {segName(c.segmentId)} · From: {c.fromEmail}</div>
            <div className="caption">Recipients: {c.recipients}{c.scheduledAt ? ` · scheduled ${new Date(c.scheduledAt).toLocaleString()}` : ''}</div>
            {stats[c.id] ? (
              <div className="stat-grid" style={{ marginTop: 12 }}>
                <Stat label="Recipients" value={stats[c.id]!.recipients} />
                <Stat label="Sent" value={stats[c.id]!.sent} />
                <Stat label="Delivered" value={stats[c.id]!.delivered} />
                <Stat label="Bounced" value={stats[c.id]!.bounced} />
                <Stat label="Opens" value={stats[c.id]!.opens} />
                <Stat label="Clicks" value={stats[c.id]!.clicks} />
                <Stat label="Unsubs" value={stats[c.id]!.unsubscribes} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <div className="caption">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
