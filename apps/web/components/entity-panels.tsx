'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/client-api';

interface NoteRow { id: string; body: string; createdAt: string; authorUserId: string; }
interface TaskRow { id: string; title: string; status: string; dueAt: string | null; }

export function NotesPanel({
  entityType, entityId, canWrite,
}: { entityType: 'contact' | 'deal' | 'company'; entityId: string; canWrite: boolean }) {
  const qc = useQueryClient();
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', entityType, entityId],
    queryFn: async () => {
      const r = await api<NoteRow[]>('GET', `/api/notes?entityType=${entityType}&entityId=${entityId}`);
      if (!r.data) throw new Error(r.error ?? 'Failed to load notes');
      return r.data;
    },
  });

  const create = useMutation({
    mutationFn: async (body: string) => {
      const r = await api('POST', '/api/notes', { body, entityType, entityId });
      if (!r.data) throw new Error(r.error ?? 'Failed to add note');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', entityType, entityId] }),
  });

  return (
    <div className="card form">
      <h3 style={{ margin: 0 }}>Notes</h3>
      {canWrite ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const body = String(fd.get('body') ?? '').trim();
          if (body) create.mutate(body);
          e.currentTarget.reset();
        }}>
          <textarea name="body" rows={3} placeholder="Add a note…" required />
          <button className="btn-primary" type="submit" style={{ marginTop: 8 }}>Add note</button>
        </form>
      ) : null}
      <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none' }}>
        {notes.length === 0 ? <li className="caption">No notes yet.</li> : notes.map((n) => (
          <li key={n.id} style={{ marginBottom: 12, borderBottom: '1px solid var(--enxi-color-border-subtle)', paddingBottom: 8 }}>
            <p className="body-sm" style={{ margin: 0 }}>{n.body}</p>
            <span className="caption">{new Date(n.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TasksPanel({
  entityType, entityId, canWrite,
}: { entityType: 'contact' | 'deal' | 'company'; entityId: string; canWrite: boolean }) {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', entityType, entityId],
    queryFn: async () => {
      const r = await api<TaskRow[]>('GET', `/api/tasks?entityType=${entityType}&entityId=${entityId}`);
      if (!r.data) throw new Error(r.error ?? 'Failed to load tasks');
      return r.data;
    },
  });

  const create = useMutation({
    mutationFn: async (title: string) => {
      const r = await api('POST', '/api/tasks', { title, entityType, entityId });
      if (!r.data) throw new Error(r.error ?? 'Failed to add task');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', entityType, entityId] }),
  });

  return (
    <div className="card form">
      <h3 style={{ margin: 0 }}>Tasks</h3>
      {canWrite ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const title = String(fd.get('title') ?? '').trim();
          if (title) create.mutate(title);
          e.currentTarget.reset();
        }}>
          <input name="title" placeholder="New task…" required />
          <button className="btn-primary" type="submit" style={{ marginTop: 8 }}>Add task</button>
        </form>
      ) : null}
      <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none' }}>
        {tasks.length === 0 ? <li className="caption">No tasks yet.</li> : tasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <span className={`pill pill-${t.status === 'done' ? 'active' : 'draft'}`}>{t.status}</span>{' '}
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
