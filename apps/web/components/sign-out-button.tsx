'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../lib/client-api';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await api('POST', '/api/auth/logout');
    setBusy(false);
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" className="btn-ghost" onClick={signOut} disabled={busy}>
      {busy ? '…' : 'Sign out'}
    </button>
  );
}
