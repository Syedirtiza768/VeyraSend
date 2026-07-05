# System Overview (Live)

> Last verified against codebase: **2026-07-05**

## Application purpose

**VeyraSend** is a multi-tenant SaaS platform for **email campaign management, transactional email (SendGrid), CRM, SMS/voice (Twilio), unified conversations, and event-driven workflows**. Each tenant gets an isolated SendGrid subuser, optional Twilio subaccount, sender/domain verification, contact segmentation, templated sends, campaign broadcasts, pipeline/deal tracking, inbound reply threading unified with SMS and call events, BullMQ-backed workflow automation, and analytics.

**Not built yet:** calendar/booking, forms/funnels, reputation management, Stripe billing, agency white-label layer. See `docs/18-implementation-roadmap.md` (Phase 16+).

## Core modules (backend)

37 NestJS modules in `apps/api/src/modules/` (+ `health`):

| Module | Purpose |
|---|---|
| `auth` | Session login/logout/me, CSRF token |
| `tenants` | One-time install bootstrap, current tenant |
| `users` | Tenant users and roles |
| `audit` | Immutable audit log |
| `sendgrid` | Subuser provisioning, encrypted API key storage |
| `senders` | SendGrid Single Sender Verification mirror |
| `domains` | SendGrid domain authentication mirror |
| `messages` | Message ledger + transactional send enqueue |
| `queue` | BullMQ `mail` worker (no HTTP) |
| `webhooks` | SendGrid events + Twilio SMS/voice webhooks |
| `events` | Raw email event stream (read API) |
| `contacts` | Contact CRUD, CSV import/export, timeline, tags |
| `lists` | Static contact lists + membership |
| `segments` | Rule-based dynamic segments |
| `suppressions` | Bounce/complaint/unsubscribe list |
| `templates` | Versioned email templates |
| `campaigns` | Broadcast campaigns to segments |
| `inbound` | Inbound Parse webhook + legacy thread API |
| `automations` | Legacy read-only API (data migrated to workflows) |
| `workflows` | Event-driven workflow engine (triggers, steps, runs) |
| `analytics` | Delivery/engagement stats |
| `settings` | Tenant retention + webhook key override |
| `usage` | Inventory counts + monthly volumes |
| `retention` | Hourly data retention sweeps (no HTTP) |
| `companies` | CRM companies |
| `pipelines` | Deal pipelines + stages |
| `deals` | Opportunities |
| `tasks` | Polymorphic tasks (contact/deal/company) |
| `notes` | Polymorphic notes |
| `tags` | Tenant tag vocabulary + contact tags |
| `custom-fields` | Custom field definitions + values |
| `twilio` | Twilio subaccount provisioning |
| `phone-numbers` | Number search, purchase, assign |
| `sms` | Outbound SMS send |
| `voice` | Call log, outbound dial, disposition |
| `conversations` | Unified inbox (email/SMS/voice per contact) |

Also: `health` module at `apps/api/src/health/`.

## User roles

Three system roles seeded per tenant (`apps/api/src/modules/tenants/tenants.service.ts`):

| Role | Scope |
|---|---|
| **owner** | All 70 permissions including `sendgrid:provision`, `twilio:provision`, `tenants:write`, `workflows:publish` |
| **admin** | Full product access except `sendgrid:provision` and `tenants:write` |
| **member** | Read-only subset: contacts, lists, templates, campaigns, CRM read, phone/calls/conversations/workflows read |

Permissions are strings `resource:action` in `packages/db/src/entities/role.entity.ts`. The UI dims sidebar items the user lacks permission for.

## High-level architecture

```
┌─────────────────────┐
│   apps/web          │  Next.js 15 App Router, port 3040
│   React 19          │  EnXi CSS + TanStack Query (CRM/conversations)
└──────────┬──────────┘
           │ session cookie + CSRF header
┌──────────▼──────────┐
│   apps/api          │  NestJS 10.4, port 4000
│   37 modules        │  Global guards: Auth → CSRF → Permissions
└──┬────────┬────┬────┘
   │        │    │
   ▼        ▼    ▼
packages/  packages/  packages/
  db       sendgrid   twilio
(TypeORM)  (SendGrid  (Twilio
           only path)  only path)
   │
   ▼
PostgreSQL 16          Redis 7
(RLS backstop)         (sessions + BullMQ mail + workflow-run queues)
           │
           ▼
   SendGrid Web API     Twilio REST + webhooks
```

Monorepo: pnpm 9 workspaces + Turborepo. See ADR-0006 in `docs/decisions/0006-tech-stack-and-layout.md`.

## Frontend

- **Framework:** Next.js 15 App Router (`apps/web`)
- **Design:** EnXi design system via CSS variables (`apps/web/styles/colors_and_type.css`)
- **Data fetching:** Server components use `serverApi`; client mutations use `api` with CSRF; TanStack Query on CRM and conversations screens
- **Routes:** 28 authed pages + `/login`, `/health`, `/` redirect

## Backend

- **Framework:** NestJS 10.4 (`apps/api`)
- **ORM:** TypeORM 0.3, `synchronize: false`, migrations only
- **Auth:** Redis-backed express-session, argon2id passwords (ADR-0003)
- **Tenancy:** `tenant_id` on all business tables + PostgreSQL RLS (ADR-0002)
- **Async:** BullMQ `mail` queue + three in-process interval tickers (campaigns 20s, automations 20s, retention 1h)

## Database

- **Engine:** PostgreSQL 16
- **Entities:** 42 TypeORM `@Entity` classes in `packages/db/src/entities/`
- **Migrations:** 17 files (12 schema + 5 permission backfills)
- **Seed:** `apps/api/src/seed.ts` (demo tenant, contacts, welcome template)

## Infrastructure

| Component | Local dev | Production-shaped |
|---|---|---|
| Postgres | `docker compose` or local | Docker Compose service |
| Redis | `docker compose` or local | Docker Compose service |
| API | `pnpm dev` or Docker | `apps/api/Dockerfile` |
| Web | `pnpm dev` or Docker | `apps/web/Dockerfile` |
| Migrations | one-shot `migrate` service | idempotent on startup |
| CI | GitHub Actions | install → typecheck → lint → build |

## Third-party services

| Service | Status | Integration point |
|---|---|---|
| **SendGrid** | **Live** | `packages/sendgrid` — sole SendGrid API path |
| **Twilio** | **Live** | `packages/twilio` — SMS, voice, webhooks; mock mode without parent creds (ADR-0007) |
| **Stripe** | **Not integrated** | Planned Phase 17 |
| **Google/OAuth SSO** | **Not integrated** | ADR-0003 designed for future OIDC |

## Related documentation

- Current state summary: [`docs/system-context.md`](../system-context.md)
- Feature matrix (live + planned): `docs/02-feature-matrix-ghl-style.md`
- ADRs: `docs/decisions/0001` through `0007`
