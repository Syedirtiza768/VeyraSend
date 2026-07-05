# 00 — Current State Audit

> **Maintained live layer:** For ongoing updates, use [`docs/system-context.md`](system-context.md)
> and [`docs/live/`](live/) — this audit is a point-in-time snapshot.
>
> Ground truth as of 2026-07-05, derived from reading the actual source tree
> (`apps/api`, `apps/web`, `packages/*`) — not from README claims. Where the
> README/PHASE_PLAN and the code disagree, this document says so explicitly.

## 0. Verdict up front

**VeyraSend is not an empty or partial repo.** It is a complete, working,
production-shaped multi-tenant SaaS application: a **SendGrid-only email
campaign & transactional-mail platform**. All 11 phases described in
`docs/PHASE_PLAN.md` are implemented in code — 24 backend modules, 19 frontend
routes, 22 database entities, 11 migrations, 11 test suites.

It is **not** a CRM, has **no pipelines/deals**, has **no Twilio/SMS/voice**,
**no calendar/booking**, **no forms/funnels/landing pages**, **no reputation
management**, **no payments**, and **no agency/sub-account layer**. Two of its
ratified architecture decisions (ADR-0004, ADR-0005) explicitly *narrow* scope
in ways that conflict with the GHL-style ambition in this brief (see §6).

Turning this into a GHL-style platform is a **major additive expansion**
built next to a well-structured existing system, not a bootstrap and not a
rewrite. The existing patterns (module-per-bounded-context, tenant_id row
scoping + RLS, single integration-wrapper packages, session+CSRF auth,
BullMQ queues, migration-only schema) are sound and should be reused, not
replaced.

## 1. Current repo structure

```
apps/
  api/                  NestJS 10.4.6 backend, port 4000
    src/modules/        24 modules (see §2)
    src/common/         guards, decorators, tenant context, crypto, correlation
    src/health/         GET /health (DB + Redis reachability)
    test/                11 Jest/Supertest suites, one per phase + isolation
  web/                  Next.js 15 (App Router) + React 19, port 3040
    app/                19 routes, all under (authed) route group except /login
    components/         16 manager/CRUD components + dashboard + nav
    lib/                client-api.ts (CSRF-aware fetch), server-api.ts (cookie-forwarding SSR fetch)
    styles/              colors_and_type.css (EnXi tokens, verbatim copy)
packages/
  config/               zod-validated typed env loader, fail-fast at boot
  db/                   TypeORM entities (22) + migrations (11), synchronize:false
  sendgrid/             SendGridClient — the ONLY code path allowed to call SendGrid
  shared/               cross-cutting enums (CampaignState, MessageStatus, EmailEventType,
                         AutomationTriggerType, AutomationActionType) + API result/error shapes
docs/
  REQUIREMENTS.md        canonical brief for the *existing* email platform (pre-dates this task)
  PHASE_PLAN.md          phase table, claims "Phases 0–11 complete"
  decisions/0001-0006    ADRs — read before proposing anything that touches them (see §6)
  phases/phase-{0,1,2}-spec.md  per-phase specs; NOTE headers say "awaiting sign-off" /
                          "in progress" even though the code for phases 1 and 2 is fully
                          implemented and tested — the spec-file status headers are stale,
                          not a sign of missing work. Verified against actual controllers,
                          services, entities, and passing test suites.
SUPPORTED.md             SendGrid capability gap analysis; also stale (still marks Phase 3+
                          rows "Pending" though the code implements them) — needs a refresh pass
                          independent of this expansion.
EnXi Design System/       source design system (colors_and_type.css, preview kits, brand docs);
                          apps/web imports colors_and_type.css directly and wraps all product
                          UI in class="enxi-product"
docker-compose.yml, .env.example, .env.docker.example
```

Workspace tooling: pnpm 9 workspaces + Turborepo, Node ≥20.10, TypeScript 5.6
everywhere, Prettier, GitHub Actions CI (`install → typecheck → lint → build`).

## 2. Existing features (by module)

| Area | What actually works today |
|---|---|
| Auth | Session-cookie login/logout, `GET /api/auth/me`, argon2id hashing, Redis session store (`connect-redis`), rotating session id, double-submit CSRF (`x-csrf-token` header + non-HttpOnly `csrf` cookie) |
| Tenancy | `Tenant`, `User` (global identity), `TenantMembership` (user↔tenant↔role); `POST /api/install` one-time bootstrap; global `AuthGuard` + tenant resolution |
| RBAC | `Role` (tenant-scoped, `permissions: text[]`), system roles owner/admin/member, `@Permissions()` guard, permission-aware nav dimming in the UI |
| Audit | `AuditLog` — every state-changing action recorded with actor/tenant/action/entity/detail |
| SendGrid provisioning | Per-tenant Subuser + Subuser API key (encrypted at rest, AES-256-GCM), mock mode when no parent key configured (ADR-0001) |
| Senders | Single Sender Verification mirror: create/list/delete/resend-verification |
| Domains | Domain authentication mirror: create, list, `GET /:id/dns` (DKIM/SPF records), `POST /:id/verify` |
| Transactional send | `POST /api/messages/send`, BullMQ `mail` queue, 6 attempts w/ exponential backoff + jitter, idempotency key, per-tenant decrypted subuser key |
| Event webhooks | `POST /api/webhooks/events` — ECDSA signature verification, sg_event_id dedup, tenant attribution via sg_message_id, updates `Message.status`, auto-creates `Suppression` rows (bounce/complaint/unsubscribe), updates `Contact.status` |
| Contacts | CRUD + CSV import, `customFields` jsonb, status enum (active/unsubscribed/bounced/complained) |
| Lists | Static named groupings + membership CRUD |
| Segments | Rule-based (`{combinator, rules[]}` jsonb), live evaluate endpoint |
| Suppressions | Auto-recorded from webhook events + manual add/remove |
| Templates | Versioned (`TemplateVersion` history), `{{variable}}` substitution, preview, test-send |
| Campaigns | Draft → scheduled/send-now → sent, targets a segment, stats rollup (sent/delivered/bounced/failed/opens/clicks/unsubs) |
| Automations | Trigger `contact.created` only (hardcoded literal, validated via `@IsIn`), steps = `send`/`delay`/`branch` only; the broader `AutomationTriggerType`/`AutomationActionType` enums in `packages/shared` are unused by this module (see §8); `AutomationEnrollment` FSM (active/completed/exited) |
| Inbound | SendGrid Inbound Parse webhook (**no signature verification** — relies on network/IP trust only), thread grouping by normalized subject, contact attribution |
| Analytics | 30-day overview + timeseries, reconciled against raw event counts |
| Settings | Per-tenant webhook verification key override, retention days (events/messages/inbound) |
| Usage | Per-tenant inventory counts + this-month message/event volumes |

## 3. Existing APIs

All routes are prefixed `/api`, session-cookie authenticated by default
(`@Public()` opts out), CSRF-guarded on mutations by default (`@SkipCsrf()`
opts out), and permission-gated via `@Permissions('resource:action')`. Full
route table: `auth`, `install`, `tenants/current`, `users(+/roles)`,
`contacts(+/import)`, `lists(+/:id/members)`, `segments(+/:id/evaluate)`,
`templates(+/versions,/preview,/test-send)`, `campaigns(+/send,/schedule,/stats)`,
`messages(+/send)`, `senders(+/resend-verification)`, `domains(+/dns,/verify)`,
`suppressions`, `webhooks/events`, `webhooks/inbound`, `inbound/threads(+/:id/messages)`,
`events`, `analytics/overview`, `analytics/timeseries`, `audit`, `settings`,
`usage`, `automations(+/:id/enrollments,/:id/status)`, `sendgrid/status`,
`sendgrid/provision`. No versioning prefix (`/api/v1`) exists yet. No public
API / API-key-based external access exists — every route assumes a browser
session. This has a direct consequence for §7 and for `05-api-design.md`.

## 4. Existing database models

PostgreSQL 16 via TypeORM, **`synchronize: false` everywhere**, 11 migrations,
22 entities: `User`, `Tenant`, `TenantMembership`, `Role`, `AuditLog`,
`Contact`, `List`, `ListMembership`, `Segment`, `Template`, `TemplateVersion`,
`Message`, `EmailEvent`, `Campaign`, `Automation`, `AutomationEnrollment`,
`Sender`, `Domain`, `Suppression`, `InboundThread`, `InboundMessage`,
`TenantSendgridSettings`, `TenantSettings`. Tenant isolation: every
tenant-scoped table carries `tenant_id` + composite indexes, enforced at three
layers (interceptor-resolved tenant context, tenant-aware repository access,
RLS policy backstop — ADR-0002). Soft delete (`deleted_at`) exists on
`Tenant`, `Contact`, `Template`, `Campaign`, `Automation`; hard delete
elsewhere. No `Company`, `Deal`, `Pipeline`, `Task`, `Note`, `Tag`,
`CustomField` (generic), `Conversation` (unified), `PhoneNumber`, `Call`,
`Calendar`, `Appointment`, `Form`, `Workflow` (generic engine), `LandingPage`,
`Funnel`, `ReviewRequest`, `Invoice`, or `BillingPlan` tables exist today —
all net-new for this expansion (full schema in `04-database-schema.md`).

## 5. Existing integrations

- **SendGrid** — deep, real integration behind `packages/sendgrid` (subuser
  provisioning, sender verification, domain auth, mail send, event webhook
  verification). Mock mode is a first-class, tested code path.
- **Twilio** — confirmed absent. No SDK, no imports, no config keys, no UI.
  (Note: SendGrid's own webhook signature header is literally named
  `X-Twilio-Email-Event-Webhook-Signature` because Twilio owns SendGrid — this
  is not evidence of Twilio integration and should not be mistaken for one.)
- **Stripe / payments** — absent.
- **Google Calendar / OAuth providers** — absent. No OIDC/SSO, though
  ADR-0003 explicitly designed the session model to accept an OIDC strategy
  later without reshaping sessions.

## 6. Existing UI screens

19 routes under `apps/web/app/(authed)/`, grouped in the sidebar as Workspace
(dashboard, users, audit, settings), Send (senders, domains, messages, events,
templates), Audience (contacts, lists, segments, suppressions), Programs
(campaigns, automations, inbox), Insights (analytics, usage). Every nav item
resolves to a real page — **no broken links, no placeholder screens** today.
Built on the EnXi design system (CSS variables only, no component library,
no React Query/SWR, no form library, no global state manager — vanilla
`useState` + fetch wrappers throughout). This is a deliberately thin stack;
introducing a data-fetching layer (React Query) is recommended before the UI
surface roughly triples in size under this expansion (see `06-frontend-information-architecture.md`).

## 7. Missing pieces (relative to the GHL-style brief)

Everything in the brief's "Core CRM" (companies, deals, pipelines, tasks,
notes, tags, custom fields, timelines), "Unified Conversations Inbox" (SMS,
calls, voicemail, cross-channel threading), all of "SMS and Phone System"
(Twilio entirely), "Marketing Automation" beyond the current single-trigger
send/delay/branch automation, "Calendar and Appointment Booking", "Forms,
Surveys, Funnels, Landing Pages", "Reputation Management", "Payments,
Invoices, Proposals", and the full "Agency/SaaS Layer" (super admin, agency
admin, sub-accounts, white-label, usage-based rebilling) — none of it exists.
This is the entire subject of `18-implementation-roadmap.md`.

## 8. Technical debt

- **Inbound Parse webhook has no signature/authenticity verification**
  (relies on obscurity/network trust). Flagged as a security risk in §9, not
  just debt — must be closed before inbound is trusted as a source for CRM
  timeline/automation triggers.
- **The shared automation enums are dead vocabulary, fully disconnected
  from the runtime**: `packages/shared` declares `AutomationTriggerType`
  (`list_added`, `tag_added`, `form_submitted`, `api_event`, `manual`,
  `email_opened`, `email_clicked`, `no_response`, `date_based`) and
  `AutomationActionType` (`send`, `wait`, `tag`, `move_list`, `notify`,
  `branch`, `stop`), but the automations module neither imports these enums
  nor matches their values: the controller hardcodes
  `@IsIn(['contact.created'])` for the trigger (a literal **absent** from
  the enum) and `@IsIn(['send','delay','branch'])` for steps (`delay` is
  not an enum value — the enum has `wait`). Verified in
  `automations.controller.ts` / `automations.service.ts`. Do not treat the
  enum members as reserved-but-planned behavior; the workflow engine
  (`09-workflow-engine.md`) should define its own registry vocabulary and
  retire these enums rather than build on them.
- **The enum/runtime disconnect is systemic, not automations-specific**:
  `campaigns.service.ts` likewise uses status literals `draft`/`scheduled`/
  `sending`/`sent` without importing `CampaignState`, whose values
  (`active`, `completed`) don't match the runtime's (`sending`, `sent`).
  `packages/shared`'s enums are partially fictional as "cross-boundary
  contracts" — before extending any of them for the expansion, check
  whether the owning module actually imports it; where it doesn't, either
  align the enum to the runtime literals or delete it. Add this
  reconciliation as an early Phase 12 cleanup task.
- **`docs/PHASE_PLAN.md`, `docs/phases/*.md`, and `SUPPORTED.md` are stale**
  relative to the code (status headers say "in progress"/"awaiting sign-off"/
  "Pending" for work that is implemented and tested). These need a refresh
  pass; until then, trust the code and this audit over those files for status.
- **No API versioning** — any external/public API surface (needed for the
  agency layer's rebilling, per-tenant integrations, or future mobile/API
  clients) starts from zero design, not an extension of an existing scheme.
- **No background job observability UI** — BullMQ jobs have no dashboard
  (e.g., Bull Board); operators currently have no way to inspect queue depth,
  failed jobs, or dead-letter items except database queries.
- **Frontend has no data-fetching cache layer** — every mutation refetches
  full lists; fine at current scale, will not scale cleanly to a Conversations
  Inbox with live updates.

## 9. Security risks

- **`docker-compose.yml` hardcodes a live-looking SendGrid API key in
  plaintext** (`SENDGRID_PARENT_API_KEY: "SG.hmqnetZ9S96kMRJwldHsrw..."`,
  line 9) instead of reading it from `${SENDGRID_PARENT_API_KEY}` like every
  other secret in the same file does. This directly violates the project's
  own rule ("No secrets in code or logs" — `docs/REQUIREMENTS.md`). The repo
  has no commits yet (`git log` shows "no commits yet"), so this has not
  been pushed to a remote — but **treat this key as compromised and rotate
  it in the SendGrid dashboard immediately regardless**, since it has sat in
  a plaintext working-tree file. Fix: change the line to
  `SENDGRID_PARENT_API_KEY: ${SENDGRID_PARENT_API_KEY:-}` (matching the
  pattern already used for `SENDGRID_WEBHOOK_VERIFICATION_KEY` two lines
  below it) before this file is ever committed.
- **Inbound Parse endpoint (`POST /api/webhooks/inbound`) is unauthenticated**
  and accepts both JSON and form-encoded bodies with no signature check —
  currently the single biggest gap. Anyone who discovers the URL can inject
  fake inbound messages/threads for a guessed tenant's contact addresses.
  SendGrid does support restricting by source IP; this is not yet enforced
  in code. Must be remediated (allowlist + shared-secret query param at
  minimum) before this becomes a trigger source for automations/CRM timeline.
- **CORS origins are hardcoded** to `localhost:3000`/`localhost:3040` in
  `http-setup.ts` — fine for dev, must become environment-driven before any
  non-localhost deployment (see `17-deployment-devops.md`).
- **No rate limiting** on any endpoint, including `/api/auth/login` (no
  brute-force throttling) and public webhook endpoints.
- **No secret rotation tooling** — `SESSION_SECRET`, `ENCRYPTION_KEY`, and the
  SendGrid parent key are static env values with no rotation runbook.
- Everything else (session cookie flags, CSRF, argon2id, tenant RLS,
  encrypted-at-rest subuser keys, audit logging) is implemented correctly and
  is a solid foundation to extend, not a risk.

## 10. Deployment gaps

- `docker-compose.yml` + `Dockerfile`s exist for `api` and `web`; `migrate`
  and `seed` are one-shot idempotent services — local/single-host deployment
  is real, not aspirational.
- No CD pipeline, no staging/production environment definitions, no secrets
  manager integration (env vars only), no horizontal-scaling guidance for the
  BullMQ worker vs. API process split (verified: the worker is constructed
  inside the API process in `queue.service.ts` — separate before SMS/voice
  volume arrives).
- **CI does not run the test suite** — `.github/workflows/ci.yml` runs only
  install/typecheck/lint/build; the 11 existing test suites do not gate
  merges. See `21-testing-strategy.md`.
- No multi-region, no CDN/static-asset strategy for the future page/funnel
  builder's public-facing pages.
- Full detail and remediation plan in `17-deployment-devops.md`.

## 11. Recommended next step

1. Do **not** touch `packages/sendgrid`, the email data model, or ADR-0001/
   0002/0003/0006 — they are sound and this expansion builds beside them.
2. Explicitly **supersede** ADR-0004 (inbound scope) and ADR-0005 (marketing/
   transactional split) with new ADRs once the unified-conversations and
   CRM-contact model are ratified (see `22-open-questions-and-decisions.md`)
   — don't silently contradict them.
3. Fix the Inbound Parse signature gap (§9) as a standalone hardening task
   before building the Conversations Inbox on top of it.
4. Start additive work at **Phase 12** (not a renumbered Phase 0) per
   `18-implementation-roadmap.md`, beginning with the generic CRM core
   (Company/Deal/Pipeline/Task/Note/Tag/CustomField) since every later module
   (Conversations, Workflows, Calendar, Reputation) hangs off `Contact`.
