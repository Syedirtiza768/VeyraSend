'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/client-api';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  entityType: string;
  entityId: string;
}

export function TasksManager({ canWrite }: { canWrite: boolean }) {
  const qc = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const r = await api<TaskRow[]>('GET', '/api/tasks?status=open');
      if (!r.data) throw new Error(r.error ?? 'Failed to load tasks');
      return r.data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'open' | 'done' }) => {
      const r = await api('PATCH', `/api/tasks/${id}`, { status });
      if (!r.data) throw new Error(r.error ?? 'Update failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return (
    <div className="card" style={{ padding: 0 }}>
      {isLoading ? <p className="caption" style={{ padding: 16 }}>Loading…</p> : null}
      <table className="data-table">
        <thead>
          <tr><th>Title</th><th>Due</th><th>Linked to</th>{canWrite ? <th></th> : null}</tr>
        </thead>
        <tbody>
          {tasks.length === 0 && !isLoading ? (
            <tr><td colSpan={canWrite ? 4 : 3} className="caption" style={{ padding: 16 }}>No open tasks.</td></tr>
          ) : tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td className="caption">{t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '—'}</td>
              <td className="caption">{t.entityType} / {t.entityId.slice(0, 8)}…</td>
              {canWrite ? (
                <td>
                  <button className="btn-ghost" onClick={() => toggle.mutate({ id: t.id, status: t.status === 'open' ? 'done' : 'open' })}>
                    {t.status === 'open' ? 'Done' : 'Reopen'}
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
