'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function PublicBookPage({ params }: { params: { slug: string } }) {
  const [slots, setSlots] = useState<Array<{ startsAt: string }>>([]);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const from = new Date();
    const to = new Date(from.getTime() + 7 * 86400000);
    fetch(`${API}/api/calendar/${params.slug}/public-slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]));
  }, [params.slug]);

  async function book(startsAt: string) {
    setMsg(null);
    const r = await fetch(`${API}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarSlug: params.slug, contactEmail: email, startsAt }),
    });
    if (r.ok) setMsg('Booked!');
    else setMsg('Booking failed.');
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: '48px auto', padding: 24 }}>
      <h1>Book an appointment</h1>
      <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <ul>{slots.map((s) => (
        <li key={s.startsAt}><button type="button" className="btn-ghost" onClick={() => book(s.startsAt)}>{new Date(s.startsAt).toLocaleString()}</button></li>
      ))}</ul>
      {msg ? <p className="caption">{msg}</p> : null}
    </div>
  );
}
