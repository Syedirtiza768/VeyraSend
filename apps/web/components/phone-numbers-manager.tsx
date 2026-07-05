'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/client-api';

interface PhoneRow {
  id: string;
  e164Number: string;
  status: string;
  assignedUserId: string | null;
  forwardTo: string | null;
  createdAt: string;
}

interface AvailableNumber {
  e164: string;
  friendlyName: string;
}

interface TwilioStatus {
  provisioned: boolean;
  subaccountSid: string | null;
}

export function PhoneNumbersManager({
  canProvision,
  canWrite,
  canDelete,
}: {
  canProvision: boolean;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const qc = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['twilio-status'],
    queryFn: async () => {
      const r = await api<TwilioStatus>('GET', '/api/twilio/status');
      if (!r.data) throw new Error(r.error ?? 'Failed to load Twilio status');
      return r.data;
    },
    enabled: canProvision,
  });

  const { data: numbers = [], isLoading } = useQuery({
    queryKey: ['phone-numbers'],
    queryFn: async () => {
      const r = await api<PhoneRow[]>('GET', '/api/phone-numbers');
      if (!r.data) throw new Error(r.error ?? 'Failed to load phone numbers');
      return r.data;
    },
  });

  const { data: available = [] } = useQuery({
    queryKey: ['phone-search'],
    queryFn: async () => {
      const r = await api<AvailableNumber[]>('GET', '/api/phone-numbers/search');
      if (!r.data) throw new Error(r.error ?? 'Search failed');
      return r.data;
    },
    enabled: canWrite && !!status?.provisioned,
  });

  const provision = useMutation({
    mutationFn: async () => {
      const r = await api<TwilioStatus>('POST', '/api/twilio/provision');
      if (!r.data) throw new Error(r.error ?? 'Provision failed');
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['twilio-status'] }),
  });

  const purchase = useMutation({
    mutationFn: async (e164Number: string) => {
      const r = await api<PhoneRow>('POST', '/api/phone-numbers', { e164Number });
      if (!r.data) throw new Error(r.error ?? 'Purchase failed');
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phone-numbers'] }),
  });

  const release = useMutation({
    mutationFn: async (id: string) => {
      const r = await api('DELETE', `/api/phone-numbers/${id}`);
      if (r.status !== 204) throw new Error(r.error ?? 'Release failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phone-numbers'] }),
  });

  return (
    <div className="mgr-grid">
      {canProvision ? (
        <div className="card form">
          <h2 style={{ margin: 0 }}>Twilio subaccount</h2>
          {statusLoading ? (
            <p className="caption">Loading…</p>
          ) : status?.provisioned ? (
            <p className="body-sm" style={{ margin: 0 }}>
              Provisioned · <code>{status.subaccountSid?.slice(0, 12)}…</code>
            </p>
          ) : (
            <>
              <p className="body-sm">Provision a Twilio subaccount before buying numbers.</p>
              <button
                className="btn-primary"
                type="button"
                disabled={provision.isPending}
                onClick={() => provision.mutate()}
              >
                Provision Twilio
              </button>
              {provision.error ? <div className="form-error">{(provision.error as Error).message}</div> : null}
            </>
          )}
        </div>
      ) : null}

      {canWrite && status?.provisioned ? (
        <div className="card form">
          <h2 style={{ margin: 0 }}>Buy a number</h2>
          <p className="caption">Mock mode returns sample numbers when Twilio credentials are not set.</p>
          <div className="field">
            <label>Available</label>
            <select
              id="buy-number"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) purchase.mutate(v);
                e.target.value = '';
              }}
            >
              <option value="">Select to purchase…</option>
              {available.map((n) => (
                <option key={n.e164} value={n.e164}>
                  {n.friendlyName} ({n.e164})
                </option>
              ))}
            </select>
          </div>
          {purchase.error ? <div className="form-error">{(purchase.error as Error).message}</div> : null}
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, gridColumn: '1 / -1' }}>
        {isLoading ? <p className="caption" style={{ padding: 16 }}>Loading…</p> : null}
        <table className="data-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Status</th>
              <th>Forward to</th>
              <th>Added</th>
              {canDelete ? <th></th> : null}
            </tr>
          </thead>
          <tbody>
            {numbers.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={canDelete ? 5 : 4} className="caption" style={{ padding: 16 }}>
                  No phone numbers yet.
                </td>
              </tr>
            ) : (
              numbers.map((n) => (
                <tr key={n.id}>
                  <td><code>{n.e164Number}</code></td>
                  <td>{n.status}</td>
                  <td className="caption">{n.forwardTo ?? '—'}</td>
                  <td className="caption">{new Date(n.createdAt).toLocaleDateString()}</td>
                  {canDelete ? (
                    <td>
                      <button className="btn-ghost" onClick={() => release.mutate(n.id)} disabled={release.isPending}>
                        Release
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
