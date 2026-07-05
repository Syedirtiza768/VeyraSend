'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../lib/client-api';

interface ActAsBannerProps {
  actAs: {
    homeTenantName: string;
    subAccountName: string;
  };
}

export function ActAsBanner({ actAs }: ActAsBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function returnHome() {
    setLoading(true);
    try {
      await api('POST', '/api/agency/act-as/return');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="status"
      style={{
        background: 'var(--accent, #6366f1)',
        color: '#fff',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
      }}
    >
      <span>
        Acting as <strong>{actAs.subAccountName}</strong> (agency: {actAs.homeTenantName})
      </span>
      <button
        type="button"
        onClick={returnHome}
        disabled={loading}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 4,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Returning…' : 'Return to agency'}
      </button>
    </div>
  );
}
