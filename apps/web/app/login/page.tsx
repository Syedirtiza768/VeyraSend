'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setCsrfToken } from '../../lib/client-api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('irtaza@acme.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api<{ csrfToken?: string }>('POST', '/api/auth/login', { email, password });
    setBusy(false);
    if (res.error || res.status !== 200) {
      setError(res.error ?? 'Login failed.');
      return;
    }
    if (res.data?.csrfToken) setCsrfToken(res.data.csrfToken);
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="wordmark">
          Veyra<span className="accent">Send</span>
        </div>
        <p className="micro" style={{ margin: '8px 0 24px' }}>
          Sign in to your workspace
        </p>

        <label className="field">
          <span className="caption">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span className="caption">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <div className="form-error">{error}</div> : null}

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
