# ADR-0003 — Auth model: session cookie + CSRF

Date: 2026-06-30 · Status: Accepted · Supersedes: none

## Context

Brief §5 asks for session-cookie vs. JWT, and whether SSO is in scope later.

## Decision

Session-cookie-based authentication with CSRF protection on the web app.
Password hashing with argon2. SSO is not built now but the auth module is
structured so an SSO/OIDC provider can be added later without reshaping
sessions.

## Consequences

- Server-side session store (Redis-backed) keyed by an opaque, rotating
  session id in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- CSRF: double-submit token for mutating routes from the browser; the API also
  requires a custom header on mutations so simple CSRF is blocked.
- argon2id for password hashing; per-user salts.
- Session creation rotates the id to prevent fixation.
- No JWTs in localStorage; no bearer tokens in the browser.
- SSO later: add an OIDC strategy that establishes the same server-side
  session — no client-side token model to migrate.
- Machine-to-machine/internal service auth (e.g. queue workers calling the API)
  is a separate, Phase-1 concern, scoped to internal network + shared secret.
