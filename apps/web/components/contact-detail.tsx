'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '../lib/client-api';
import { NotesPanel, TasksPanel } from './entity-panels';

interface ContactDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  lifecycleStage: string;
  phone: string | null;
  companyId: string | null;
  leadSource: string | null;
}

interface TimelineEntry {
  id: string;
  type: string;
  action: string;
  summary: string;
  createdAt: string;
}

interface TagRow { id: string; name: string; }

export function ContactDetailView({
  contactId, canWrite, canNotes, canTasks,
}: {
  contactId: string;
  canWrite: boolean;
  canNotes: boolean;
  canTasks: boolean;
}) {
  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const r = await api<ContactDetail>('GET', `/api/contacts/${contactId}`);
      if (!r.data) throw new Error(r.error ?? 'Contact not found or you don\'t have access');
      return r.data;
    },
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['contact-timeline', contactId],
    enabled: !!contact,
    queryFn: async () => {
      const r = await api<TimelineEntry[]>('GET', `/api/contacts/${contactId}/timeline`);
      return r.data ?? [];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['contact-tags', contactId],
    enabled: !!contact,
    queryFn: async () => {
      const r = await api<TagRow[]>('GET', `/api/contacts/${contactId}/tags`);
      return r.data ?? [];
    },
  });

  if (isLoading) return <p className="caption">Loading contact…</p>;
  if (error || !contact) return <div className="card"><p>Contact not found or you don&apos;t have access.</p></div>;

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email;

  return (
    <div className="mgr-grid">
      <div className="mgr-side">
        <div className="card">
          <h2 style={{ margin: 0 }}>{name}</h2>
          <p className="body-sm" style={{ margin: '8px 0' }}>{contact.email}</p>
          {contact.phone ? <p className="caption">Phone: {contact.phone}</p> : null}
          <p className="caption">Lifecycle: {contact.lifecycleStage} · Status: {contact.status}</p>
          {tags.length > 0 ? (
            <p>{tags.map((t) => <span key={t.id} className="pill pill-active" style={{ marginRight: 6 }}>{t.name}</span>)}</p>
          ) : null}
          <Link href="/contacts" className="caption">← Back to contacts</Link>
        </div>
        {canNotes ? <NotesPanel entityType="contact" entityId={contactId} canWrite={canWrite} /> : null}
        {canTasks ? <TasksPanel entityType="contact" entityId={contactId} canWrite={canWrite} /> : null}
      </div>
      <div className="card form">
        <h3 style={{ margin: 0 }}>Timeline</h3>
        {timeline.length === 0 ? (
          <p className="caption">No activity yet.</p>
        ) : (
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
            {timeline.map((e) => (
              <li key={`${e.type}-${e.id}`} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--enxi-color-border-subtle)' }}>
                <span className="caption">{new Date(e.createdAt).toLocaleString()}</span>
                <p className="body-sm" style={{ margin: '4px 0 0' }}>{e.summary}</p>
                <span className="micro">{e.action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
