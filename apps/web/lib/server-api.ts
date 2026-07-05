import 'server-only';
import { cookies } from 'next/headers';

export const API_BASE = process.env.API_BASE || 'http://localhost:4000';

export interface ServerApiResult<T> {
  status: number;
  data?: T;
  error?: string;
}

/**
 * Server-side fetch to the API. Forwards the browser cookies (so the session
 * travels) and disables caching. Use only in server components.
 */
export async function serverApi<T>(path: string, init?: RequestInit): Promise<ServerApiResult<T>> {
  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      cookie: cookieHeader,
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = { message: text };
  }
  if (!res.ok) {
    return { status: res.status, error: (parsed as { message?: string })?.message ?? res.statusText };
  }
  return { status: res.status, data: parsed as T };
}

export interface MeResponse {
  user: { id: string; email: string; name: string | null };
  tenant: { id: string };
  role: { id: string; name: string };
  permissions: string[];
  actAs?: {
    homeTenantId: string;
    homeTenantName: string;
    subAccountId: string;
    subAccountName: string;
  } | null;
}

export async function getCurrentUser(): Promise<MeResponse | null> {
  const r = await serverApi<MeResponse>('/api/auth/me');
  return r.data ?? null;
}
