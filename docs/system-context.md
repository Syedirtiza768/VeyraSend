# VeyraSend — System Context

> **Single source of truth for the current application state.**
> AI coding agents: read this file **before** making changes; update it **after** completing changes.
> Last verified against codebase: **2026-07-05**

## Quick facts

| Item | Value |
|---|---|
| **Product** | Multi-tenant email + CRM + SMS/voice + unified conversations (SendGrid + Twilio) |
| **Not built** | Platform super-admin UI, custom domain routing |
| **Phase 12 (CRM)** | **Live** — companies, pipelines, deals, tasks, notes, tags, custom fields, contact timeline |
| **Phase 13 (Twilio)** | **Live** — SMS send/receive, STOP/START, phone numbers, call log, Twilio webhooks, inbound parse secret |
| **Phase 14 (Conversations)** | **Live** — unified inbox per contact (email/SMS/voice), channel filter, notes, `/conversations` |
| **Phase 15 (Workflows)** | **Live** — event-driven workflow engine, BullMQ `workflow-run` queue, `/workflows` UI, automations read-only |
| **Phase 16 (Calendar/Forms)** | **Live** — booking calendars, forms, landing pages/funnels, reputation review requests |
| **Phase 17 (Billing)** | **Live** — Stripe invoices, payment links, webhook-confirmed payments, `invoice.paid` trigger |
| **Phase 18 (Agency)** | **Live** — agency/sub-account hierarchy, act-as elevation, billing plans, feature flags, usage rollup |
| **Backend** | NestJS 10.4 · port 4000 · 43 modules · `/api` prefix |
| **Frontend** | Next.js 15 App Router · React 19 · port 3040 · 42 pages |
| **Database** | PostgreSQL 16 · 63 entities · 25 migrations · RLS on tenant tables |
| **Queue** | BullMQ `mail` + `workflow-run` on Redis 7 · 2 interval tickers (campaigns, retention) |
| **Auth** | Session cookie + CSRF · argon2id · Redis sessions (ADR-0003) |
| **Tenancy** | `tenant_id` row scoping + PostgreSQL RLS (ADR-0002) |
| **Integration** | SendGrid (`packages/sendgrid`) + Twilio (`packages/twilio`) · mock mode without parent keys |
| **Tests** | 18 API test suites · CI: typecheck, lint, build (tests not gated) |
| **Phases complete** | 0–18 (full roadmap) |

## What this app does (Live)

1. **Provision** per-tenant SendGrid subusers with encrypted API keys
2. **Verify** senders and domains via SendGrid mirror APIs
3. **Manage audience:** contacts (CSV import), lists, rule-based segments, suppressions
4. **Send email:** transactional (BullMQ), broadcast campaigns (scheduled or immediate)
5. **Track events:** signed SendGrid webhook → message status, analytics, auto-suppression
6. **Template** versioned HTML/text with `{{variables}}`
7. **Automate** event-driven workflows (triggers + step-list DSL) via BullMQ; legacy `/automations` read-only
8. **Receive replies:** SendGrid Inbound Parse → threaded inbox (optional `SENDGRID_INBOUND_PARSE_SECRET`)
9. **SMS & voice:** Twilio subaccounts, phone numbers, SMS send/receive with STOP/START, call log
10. **Unified conversations:** one thread per contact across email/SMS/voice at `/conversations`
11. **Administer:** users/RBAC, audit log, settings, usage stats, data retention

## Repository map

```
apps/api/src/modules/     37 NestJS modules (+ health)
apps/web/app/             29 authed pages + login + health + redirect
packages/db/              TypeORM entities (48) + migrations (19)
packages/sendgrid/        Sole SendGrid access path
packages/twilio/          Sole Twilio access path
packages/shared/          Enums: CampaignState, MessageStatus, EmailEventType, Automation*
packages/config/          Zod env validation
docs/live/                Live documentation (detailed reference)
docs/decisions/           Ratified ADRs 0001–0007
docs/00–22                Planning docs for GHL-style expansion (roadmap + specs)
```

## Backend modules (all Live)

`auth` · `tenants` · `users` · `audit` · `sendgrid` · `senders` · `domains` · `messages` · `queue` · `webhooks` · `events` · `contacts` · `lists` · `segments` · `suppressions` · `templates` · `campaigns` · `inbound` · `automations` (read-only) · `workflows` · `analytics` · `settings` · `usage` · `retention` · `companies` · `pipelines` · `deals` · `tasks` · `notes` · `tags` · `custom-fields` · `twilio` · `phone-numbers` · `sms` · `voice` · `conversations`

## Frontend routes (all Live)

| Group | Routes |
|---|---|
| Workspace | `/dashboard`, `/users`, `/audit`, `/settings` |
| Send | `/senders`, `/domains`, `/messages`, `/phone-numbers`, `/calls`, `/events`, `/templates` |
| Audience | `/contacts`, `/contacts/[id]`, `/companies`, `/companies/[id]`, `/lists`, `/segments`, `/suppressions` |
| Sales | `/pipelines`, `/deals/[id]`, `/tasks` |
| Programs | `/campaigns`, `/workflows`, `/automations` (legacy read-only), `/conversations` (legacy `/inbox` redirects) |
| Insights | `/analytics`, `/usage` |

Nav defined in `apps/web/app/(authed)/layout.tsx`. All links valid — no 404s.

## API surface

~120 routes under `/api`. Full table: `docs/live/04-api-reference.md`.

**Public endpoints:** `/health`, `/api/auth/csrf`, `/api/auth/login`, `/api/install`, `/api/webhooks/events`, `/api/webhooks/inbound`, `/api/webhooks/twilio/sms`, `/api/webhooks/twilio/voice`, `/api/webhooks/twilio/voice/status`

**Global guards:** AuthGuard → CsrfGuard → PermissionsGuard

## Database

48 entities · 19 migrations. Key tables: `tenants`, `users`, `contacts`, `companies`, `deals`, `pipelines`, `messages`, `conversations`, `workflows`, `workflow_runs`, `phone_numbers`, `calls`, `campaigns`, `templates`, `automations`, `inbound_threads`, `tenant_sendgrid_settings`, `tenant_twilio_settings`.

Full schema: `docs/live/05-database.md`.

**Seed:** `pnpm --filter @veyrasend/api seed` → demo tenant (`owner@demo.veyrasend` / `demo-owner-password-123`)

## Partial / broken features

| Feature | Status | Detail |
|---|---|---|
| Automations (legacy) | **Read-only** | `/api/automations` GET only; writes return 410. Data migrated to `workflows`. Use `/workflows` instead. |
| Workflows | **Live (P15)** | Step-list builder; triggers wired for CRM + comms; dry-run test mode. Graph editor UI deferred. |
| Missed-call SMS | **Workflow** | `call.missed` trigger dispatch; hardcoded text-back removed from `VoiceService`. |
| Lists UI | **Partial** | CRUD works; member add/remove API exists but no UI. |
| Inbound webhook | **Hardened** | Optional `SENDGRID_INBOUND_PARSE_SECRET` query param on `POST /api/webhooks/inbound`. |
| Usage page label | **Misleading** | Says "billing" but billing is not built. |
| Dashboard | **Stale copy** | Still references future phases for features that exist. |

## Not implemented (Post-roadmap)

Platform super-admin cross-tenant console, custom domain white-label routing, Stripe Connect agency rebilling UI.

See: `docs/02-feature-matrix-ghl-style.md`, `docs/18-implementation-roadmap.md`

## Architecture decisions (still in force)

| ADR | Decision |
|---|---|
| [0001](decisions/0001-sendgrid-integration-model.md) | Parent SendGrid account + per-tenant subusers |
| [0002](decisions/0002-tenancy-isolation.md) | Single DB, tenant_id + RLS |
| [0003](decisions/0003-auth-model.md) | Session cookie + CSRF, argon2id |
| [0004](decisions/0004-inbound-inbox-scope.md) | Email via Inbound Parse only (product "not omnichannel" superseded by P14; ADR-0008 pending) |
| [0005](decisions/0005-marketing-transactional-split.md) | Campaigns vs transactional send as distinct subsystems |
| [0007](decisions/0007-twilio-integration-model.md) | Parent Twilio account + per-tenant subaccounts |

## Roles & permissions

System roles per tenant: **owner** (all perms incl. `sendgrid:provision`), **admin** (all except provision/tenants:write), **member** (read-only subset).

67 permission strings + 3 workflow permissions = **70** in `packages/db/src/entities/role.entity.ts`. UI dims nav items without permission.

## Background processing

| Job | Mechanism | Interval/Config |
|---|---|---|
| Email send | BullMQ `mail` queue | 6 attempts, exp backoff |
| Workflow steps | BullMQ `workflow-run` queue | 5 attempts, exp backoff; delay via job `delay` option |
| Scheduled campaigns | `CampaignsService` ticker | 20s |
| Data retention | `RetentionService` ticker | 1 hour |

## Environment & run

```bash
# Docker full stack
docker compose up --build   # → http://localhost:3040

# Local dev
pnpm install && cp .env.example .env
docker compose up -d postgres redis
pnpm --filter @veyrasend/db migration:run
pnpm --filter @veyrasend/api seed
pnpm dev
```

Env vars: `.env.example`. API fails fast on missing/invalid config.

## Known risks & debt

1. **Inbound parse secret optional** — when unset, webhook accepts unauthenticated posts (dev only)
2. **No rate limiting** on login or webhooks
3. **CORS hardcoded** to localhost in `http-setup.ts`
4. **No API versioning** (`/api/v1`)
5. **No queue observability UI** (Bull Board)
6. **Planning doc headers stale** — `PHASE_PLAN.md`, `00-current-state-audit.md` snapshot pre-P12; trust `system-context.md` + `docs/live/*`
7. **docker-compose.yml** may contain hardcoded secrets — rotate before commit (see audit §9)

## Frontend ↔ backend sync

All sidebar routes map to live pages and APIs. Gaps:

- List member management: API yes, UI no
- No dynamic detail routes (`/campaigns/[id]`, etc.)

Full sync matrix: `docs/live/06-frontend-backend-sync.md`

## Documentation map

| Need | Read |
|---|---|
| Feature details & flows | `docs/live/02-features.md` |
| Auth, jobs, errors, debt | `docs/live/03-technical-reference.md` |
| All API endpoints | `docs/live/04-api-reference.md` |
| Database schema | `docs/live/05-database.md` |
| UI ↔ API mapping | `docs/live/06-frontend-backend-sync.md` |
| How to maintain docs | `docs/live/DOCUMENTATION_RULES.md` |
| Change history | `docs/live/CHANGELOG.md` |
| Future roadmap | `docs/18-implementation-roadmap.md` |

## Agent update checklist

After any code change, update:

- [ ] This file (`docs/system-context.md`) — summary sections affected
- [ ] Relevant `docs/live/*.md` file(s)
- [ ] `docs/live/CHANGELOG.md` — new entry with date, what, why, files

Do **not** document planned features as Live. Use status labels from `DOCUMENTATION_RULES.md`.
