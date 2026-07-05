'use client';

import { useState, Fragment } from 'react';
import { api } from '../lib/client-api';

interface DnsRecord {
  host: string;
  type: 'TXT' | 'CNAME' | 'MX';
  data: string;
  valid?: boolean | null;
}

interface DomainRow {
  id: string;
  domainId: string;
  domain: string;
  verified: boolean;
  dns: DnsRecord[];
  createdAt: string;
}

interface Status {
  provisioned: boolean;
  region: string | null;
  subuserUsername: string | null;
  provisionedAt: string | null;
}

interface Props {
  initialStatus: Status;
  initialDomains: DomainRow[];
  canWrite: boolean;
  canProvision: boolean;
}

export function DomainsManager({ initialStatus, initialDomains, canWrite, canProvision }: Props) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [domains, setDomains] = useState<DomainRow[]>(initialDomains);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function provision() {
    setBusy(true);
    setError(null);
    const res = await api<Status>('POST', '/api/sendgrid/provision');
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.error ?? 'Provision failed.');
      return;
    }
    setStatus(res.data);
  }

  async function createDomain(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api<{ data: DomainRow }>('POST', '/api/domains', { domain });
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.error ?? 'Create failed.');
      return;
    }
    setDomains((prev) => [...prev, res.data!.data]);
    setDomain('');
  }

  async function verify(d: DomainRow) {
    const res = await api<{ verified: boolean; reason?: string }>('POST', `/api/domains/${d.id}/verify`);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDomains((prev) => prev.map((x) => (x.id === d.id ? { ...x, verified: res.data!.verified } : x)));
  }

  async function remove(id: string) {
    const res = await api('DELETE', `/api/domains/${id}`);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDomains((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h2>SendGrid subuser</h2>
        {status.provisioned ? (
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Provisioned · region <code>{status.region}</code> · subuser <code>{status.subuserUsername}</code>
          </p>
        ) : canProvision ? (
          <>
            <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: '0 0 12px' }}>
              Not provisioned. Provisions a dedicated SendGrid subuser for this tenant (ADR-0001).
            </p>
            <button className="btn-primary" onClick={provision} disabled={busy}>
              {busy ? 'Provisioning…' : 'Provision subuser'}
            </button>
          </>
        ) : (
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-secondary)', margin: 0 }}>
            Not provisioned. Ask an owner to provision the SendGrid subuser.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Domains</h2>
        <table className="status">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Status</th>
              <th>DNS</th>
              {canWrite ? <th className="status-pill"></th> : null}
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <Fragment key={d.id}>
                <tr>
                  <td>{d.domain}</td>
                  <td className="status-pill">
                    <span className={d.verified ? 'pill ok' : 'pill pending'}>{d.verified ? 'verified' : 'pending'}</span>
                  </td>
                  <td className="status-pill">
                    <button className="btn-ghost" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                      {expanded === d.id ? 'Hide' : 'View'}
                    </button>
                  </td>
                  <td className="status-pill">
                    {canWrite && status.provisioned ? (
                      <span className="row-actions">
                        <button className="btn-ghost" onClick={() => verify(d)}>
                          Verify
                        </button>
                        <button className="btn-ghost" onClick={() => remove(d.id)}>
                          Delete
                        </button>
                      </span>
                    ) : null}
                  </td>
                </tr>
                {expanded === d.id ? (
                  <tr className="dns-row">
                    <td colSpan={4}>
                      <table className="dns-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Host</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.dns.map((r, i) => (
                            <tr key={i}>
                              <td className="meta">{r.type}</td>
                              <td className="meta">{r.host}</td>
                              <td className="meta dns-value">{r.data}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {domains.length === 0 ? (
              <tr>
                <td className="meta" colSpan={4}>
                  No domains yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {canWrite && status.provisioned ? (
          <form className="form" style={{ marginTop: 24, maxWidth: 420 }} onSubmit={createDomain}>
            <label className="field">
              <span className="caption">Domain</span>
              <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" required />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Adding…' : 'Authenticate domain'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
