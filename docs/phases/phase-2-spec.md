# Phase 2 — SendGrid Integration + Senders/Domains

Status: **in progress** · Gate: see §4 · Depends on: Phase 1 (approved)

## 1. Goal

Wire the platform to SendGrid per ADR-0001 (parent account + one subuser per
tenant), provision a subuser and store its API key encrypted at rest, and let a
tenant authenticate sender identities (Single Sender Verification) and domains
(DKIM/SPF/DMARC), viewing the real DNS records SendGrid returns. Runs fully in
mock mode when no parent key is supplied, and against the real API when one is.

## 2. Scope

In scope:

- `packages/sendgrid`: real client calls via `@sendgrid/client` for subusers,
  subuser API keys, single-sender verification, and domain authentication
  (create / list / get / validate / delete). Subuser-scoped calls use the
  `on-behalf-of` header with the parent key. Mock mode returns deterministic
  fakes so the whole flow is demoable without a key.
- Config: add `ENCRYPTION_KEY` (32-byte hex) used to encrypt subuser API keys
  at rest. Required when `SENDGRID_MOCK_MODE=false`, optional in mock.
- DB migration `…SendgridSendersDomains`: `tenant_sendgrid_settings`
  (one row per tenant: subuser username + encrypted API key + region),
  `senders` (tenant-scoped, mirrors SendGrid sender verification),
  `domains` (tenant-scoped, mirrors authenticated domains + DNS records).
  `synchronize` stays false.
- API modules:
  - `sendgrid` provisioning: `POST /api/sendgrid/provision` (owner-only,
    idempotent — one subuser per tenant), `GET /api/sendgrid/status`.
  - `senders`: `GET/POST /api/senders`, `DELETE /api/senders/:id`,
    `POST /api/senders/:id/resend-verification`.
  - `domains`: `GET/POST /api/domains`, `GET /api/domains/:id/dns`,
    `POST /api/domains/:id/verify`, `DELETE /api/domains/:id`.
- New permissions `senders:read`, `senders:write`, `domains:read`,
  `domains:write`, `sendgrid:provision`; added to system role specs (owner:
  all; admin: read+write on senders/domains; member: none).
- Audit log: provision, sender create/delete, domain create/verify/delete.
- Web UI (EnXi): `/senders` and `/domains` pages — list, add, view DNS
  records, verify, status pills. RBAC-aware controls.

Out of scope: actual mail send (Phase 3), event webhooks (Phase 3), contacts /
lists (Phase 4), template rendering (Phase 5). Subuser IP pool management is
out of scope (default shared pool).

## 3. Deliverables

- `docs/phases/phase-2-spec.md` (this file).
- `packages/sendgrid` real + mock implementation.
- `packages/config` `encryptionKey` field.
- `packages/db` entities + migration.
- `apps/api` modules: `sendgrid`, `senders`, `domains`; crypto helper.
- `apps/web` `/senders`, `/domains` pages + rail entries.
- Tests under `apps/api/test`.
- Updated `SUPPORTED.md`.

## 4. Acceptance gate

1. `POST /api/sendgrid/provision` creates exactly one subuser per tenant; a
   second call returns the existing one (idempotent), not a duplicate.
2. The subuser API key is stored **encrypted** at rest (never plaintext in the
   DB or logs); `redactedConfig` still redacts secrets.
3. `POST /api/senders` creates a single-sender verification record; the list
   shows it with a `pending`/`verified` status.
4. `POST /api/domains` returns the DNS records SendGrid requires (DKIM/SPF);
   `GET /api/domains/:id/dns` shows them; `POST .../verify` reflects the
   validation result.
5. Tenant A cannot see or operate on Tenant B's senders/domains (test proves
   it); a member role cannot provision or write senders/domains (403, test).
6. In mock mode (no parent key) the entire flow still works with deterministic
   fake data; with a real key the same code path calls SendGrid.
7. `synchronize` false; `pnpm typecheck` + `pnpm lint` + `pnpm test` + build
   pass.
8. Web: `/senders` and `/domains` work end-to-end at `http://localhost:3040`.
