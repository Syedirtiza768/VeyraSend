'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/client-api';

interface CallRow {
  id: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  durationSeconds: number | null;
  disposition: string | null;
  contactId: string | null;
  createdAt: string;
}

export function CallsManager() {
  const { data: calls = [], isLoading, error } = useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const r = await api<CallRow[]>('GET', '/api/calls');
      if (!r.data) throw new Error(r.error ?? 'Failed to load calls');
      return r.data;
    },
  });

  return (
    <div className="card" style={{ padding: 0 }}>
      {isLoading ? <p className="caption" style={{ padding: 16 }}>Loading…</p> : null}
      {error ? <div className="form-error" style={{ padding: 16 }}>{(error as Error).message}</div> : null}
      <table className="data-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Direction</th>
            <th>From</th>
            <th>To</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Disposition</th>
          </tr>
        </thead>
        <tbody>
          {calls.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={7} className="caption" style={{ padding: 16 }}>No calls logged yet.</td>
            </tr>
          ) : (
            calls.map((c) => (
              <tr key={c.id}>
                <td className="caption">{new Date(c.createdAt).toLocaleString()}</td>
                <td>{c.direction}</td>
                <td><code>{c.fromNumber}</code></td>
                <td><code>{c.toNumber}</code></td>
                <td>{c.status}</td>
                <td className="caption">{c.durationSeconds != null ? `${c.durationSeconds}s` : '—'}</td>
                <td className="caption">{c.disposition ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
