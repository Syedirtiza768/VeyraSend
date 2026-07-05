'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function PublicFunnelPage({ params }: { params: { slug: string } }) {
  const [state, setState] = useState<{ available?: boolean; page?: { name: string; content: unknown[] } } | null>(null);

  useEffect(() => {
    fetch(`${API}/api/funnels/pages/${params.slug}`)
      .then((r) => r.json())
      .then(setState)
      .catch(() => setState({ available: false }));
  }, [params.slug]);

  if (!state) return <div className="card" style={{ margin: 48, padding: 24 }}>Loading…</div>;
  if (!state.available) {
    return <div className="card" style={{ margin: 48, padding: 24 }}><h1>Page not available</h1><p className="caption">This page is not published yet.</p></div>;
  }
  return (
    <div className="card" style={{ maxWidth: 720, margin: '48px auto', padding: 24 }}>
      <h1>{state.page?.name}</h1>
      <pre className="caption">{JSON.stringify(state.page?.content, null, 2)}</pre>
    </div>
  );
}
