# VeyraSend

A multi-tenant Email Campaign & Email Management Platform on top of the
SendGrid Web API. Built phase by phase; see `docs/REQUIREMENTS.md` for the
contract and `docs/phases/phase-0-spec.md` for the current phase.

> **Developers & AI agents:** read [`docs/system-context.md`](docs/system-context.md)
> first — it is the single source of truth for what exists today.
> Live documentation: [`docs/live/`](docs/live/).

## Architecture (ratified)

See `docs/decisions/`:

- 0001 — Parent account + Subusers (per-tenant isolation).
- 0002 — Single DB, `tenant_id` row scoping.
- 0003 — Session cookie + CSRF auth.
- 0004 — Inbound Parse replies only (not a general inbox).
- 0005 — Marketing Campaigns APIs + Mail Send as distinct subsystems.
- 0006 — Stack and monorepo layout.

## Layout

```
apps/
  api/        NestJS backend (port 4000)
  web/        Next.js frontend (port 3040)
packages/
  config/     typed env config (fail-fast)
  db/         TypeORM entities + migrations (synchronize: false)
  sendgrid/   the only place that talks to SendGrid
  shared/     shared types, DTOs, enums, schemas
docs/         per-phase specs, ADRs, runbooks
SUPPORTED.md  living SendGrid capability gap analysis
```

## Prerequisites

- Node 20+
- pnpm 9+
- Docker (for the full stack, or Postgres + Redis only in local dev)

## Quick start

### Docker (full stack)

Runs Postgres, Redis, migrations, seed, API, and web in containers:

```bash
cp .env.docker.example .env   # optional overrides (SESSION_SECRET, etc.)
docker compose up --build
```

Open http://localhost:3040 and log in with the seeded demo account:

- Email: `owner@demo.veyrasend`
- Password: `demo-owner-password-123`

Health checks:

- API:  http://localhost:4000/health
- Web:  http://localhost:3040/health

`migrate` and `seed` are one-shot services that run before the API starts. Re-running
`docker compose up` is safe — both are idempotent.

Stop any local `pnpm dev` process using ports 4000/3040 before starting the full stack.

### Local development (host Node)

```bash
pnpm install
cp .env.example .env          # fill in required values
docker compose up -d postgres redis   # infra only
pnpm --filter @veyrasend/db migration:run
pnpm --filter @veyrasend/api seed   # optional: demo tenant + sample data
pnpm dev                      # starts api + web via turbo
```

## Config

All required env vars are documented in `.env.example`. The API fails fast at
boot if any required var is missing or invalid — no partial startup.

## Status

Phases 0–11 complete. The platform implements tenant-scoped SendGrid subuser
provisioning, sender/domain verification, transactional send (BullMQ), signed +
deduped event webhooks, contacts/lists/segments/suppressions with CSV import,
versioned templates, scheduled campaigns, inbound reply threading, event-driven
automations (delay + branch), reconciled analytics, and admin tooling (settings,
audit, usage, retention). Fresh-env smoke + seed verified; full suite green
(11 suites, 46 tests). See `docs/PHASE_PLAN.md`.
