'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/client-api';

interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  phone: string | null;
  createdAt: string;
}

export function CompaniesManager({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const qc = useQueryClient();
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const r = await api<CompanyRow[]>('GET', '/api/companies');
      if (!r.data) throw new Error(r.error ?? 'Failed to load companies');
      return r.data;
    },
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const r = await api<CompanyRow>('POST', '/api/companies', { name });
      if (!r.data) throw new Error(r.error ?? 'Create failed');
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const r = await api('DELETE', `/api/companies/${id}`);
      if (r.status !== 204) throw new Error(r.error ?? 'Delete failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });

  return (
    <div className="mgr-grid">
      {canWrite ? (
        <form className="card form" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get('name') ?? '');
          if (name.trim()) create.mutate(name.trim());
          e.currentTarget.reset();
        }}>
          <h2 style={{ margin: 0 }}>Add company</h2>
          <div className="field">
            <label>Name</label>
            <input name="name" required />
          </div>
          <button className="btn-primary" type="submit" disabled={create.isPending}>Add</button>
          {create.error ? <div className="form-error">{(create.error as Error).message}</div> : null}
        </form>
      ) : null}

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <p className="caption" style={{ padding: 16 }}>Loading…</p> : null}
        {error ? <p className="form-error" style={{ padding: 16 }}>{(error as Error).message}</p> : null}
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Domain</th><th>Added</th>{canDelete ? <th></th> : null}</tr>
          </thead>
          <tbody>
            {companies.length === 0 && !isLoading ? (
              <tr><td colSpan={canDelete ? 4 : 3} className="caption" style={{ padding: 16 }}>No companies yet — add one or import contacts with a company field.</td></tr>
            ) : companies.map((c) => (
              <tr key={c.id}>
                <td><a href={`/companies/${c.id}`}>{c.name}</a></td>
                <td>{c.domain ?? '—'}</td>
                <td className="caption">{new Date(c.createdAt).toLocaleString()}</td>
                {canDelete ? (
                  <td><button className="btn-ghost" onClick={() => remove.mutate(c.id)}>Delete</button></td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
