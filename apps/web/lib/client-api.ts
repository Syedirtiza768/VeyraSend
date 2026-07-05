'use client';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

let csrfToken: string | null = null;

async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: 'include' });
  const body = (await res.json()) as { token: string };
  csrfToken = body.token;
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export interface ApiError {
  status: number;
  message: string;
}

export async function api<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<{ status: number; data?: T; error?: string }> {
  const headers: Record<string, string> = {};
  let token: string | null = null;
  if (method !== 'GET') {
    token = await ensureCsrf();
    headers['x-csrf-token'] = token;
  }
  if (body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = { message: text };
  }
  // Keep the in-memory token in sync if the server rotated it (e.g. on login).
  if (typeof parsed === 'object' && parsed && 'csrfToken' in parsed) {
    csrfToken = (parsed as { csrfToken: string }).csrfToken;
  }
  if (!res.ok) {
    return { status: res.status, error: (parsed as { message?: string })?.message ?? res.statusText };
  }
  return { status: res.status, data: parsed as T };
}
