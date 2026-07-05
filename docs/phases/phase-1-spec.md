# Phase 1 — Auth, Tenancy, RBAC, Users

Status: **in progress** · Gate: see §4 · Depends on: Phase 0 (approved)

## 1. Goal

Secure login (email/password), the tenant model, user-tenant membership,
roles/permissions, a global tenant guard + scoping, the audit log foundation,
and user management UI — with provable tenant isolation and RBAC enforcement.

## 2. Scope

In scope:

- Entities + migrations: `Tenant`, `User`, `Role`, `TenantMembership`,
  `AuditLog`. Tenant-scoped tables carry `tenant_id` + indexes + RLS policies
  (ADR-0002). `User` is a global identity; `TenantMembership` binds a user to a
  tenant with a role.
- Auth (ADR-0003): `express-session` backed by Redis, `HttpOnly`+`Secure`+`SameSite=Lax`
  cookie, argon2id password hashing, rotating session id on login, CSRF
  double-submit token for mutations.
- Bootstrap: an idempotent `POST /api/install` (only when zero tenants exist)
  creates the first tenant + admin user. After that it is disabled.
- Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`,
  `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id` (RBAC-gated),
  `GET /api/tenants/current`.
- Tenant guard + global interceptor: resolve the active tenant from the session
  membership and inject it into `TenantContextService`; refuse tenant-scoped
  work without it.
- RBAC: `@Permissions('users:read')` decorator + guard; permissions stored on
  the role; system roles `owner` and `admin` seeded per tenant.
- Audit log: every state-changing action (login, user create/update, role
  change) recorded with `actorUserId`, `tenantId`, `action`, `entityType`,
  `entityId`, `detail`.
- Web UI: login page, authed app shell (EnXi), dashboard, users management
  (list, invite/create, edit role) with RBAC-aware controls.
- Tests: (a) a user in Tenant A provably cannot read Tenant B data; (b) RBAC
  blocks an unauthorized action.

Out of scope: SSO, password reset/email, multi-membership switching UI, billing,
SendGrid work (Phase 2).

## 3. Deliverables

- `docs/phases/phase-1-spec.md` (this file).
- `packages/db` entities + migration(s).
- `apps/api` modules: `tenants`, `users`, `rbac`, `auth`, `audit`, plus
  `common` tenant guard/interceptor and session/CSRF wiring.
- `apps/web` login + authed shell + users pages.
- Tests under `apps/api/test`.
- Updated `SUPPORTED.md` (auth/tenancy rows move to Supported).

## 4. Acceptance gate

1. `POST /api/install` bootstraps the first tenant + admin; a second call is
   rejected.
2. Login returns a session; `GET /api/auth/me` returns the user + active tenant
   + permissions.
3. A user in Tenant A listing users sees only Tenant A users; attempting to
   read a Tenant B user id returns 404 (not a leak). Test proves this.
4. A user without `users:write` cannot create/edit a user (403). Test proves it.
5. Mutations require a valid CSRF token; missing/mismatched → 403.
6. Every state-changing action writes an `AuditLog` row scoped to the tenant.
7. `synchronize` still false; all schema via migration; `pnpm typecheck` +
   `pnpm lint` + `pnpm test` pass.
8. Web: login → dashboard → users management works end to end at
   `http://localhost:3040`.
