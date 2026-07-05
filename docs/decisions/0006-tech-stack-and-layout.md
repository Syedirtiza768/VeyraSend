# ADR-0006 — Tech stack and monorepo layout

Date: 2026-06-30 · Status: Accepted · Supersedes: none

## Context

Brief §3 mandates the stack and a suggested monorepo layout.

## Decision

Adopt the mandated stack and layout, with the EnXi design system as the product
UI visual language.

### Stack

- Monorepo: pnpm workspaces + Turborepo.
- Backend: NestJS, one module per bounded context.
- Frontend: Next.js App Router, TypeScript, server components where sensible.
- Database: PostgreSQL 16 via TypeORM, **migrations only** (`synchronize:
  false` everywhere).
- Queue/scheduler: BullMQ on Redis 7.
- Auth: session-cookie + CSRF (ADR-0003), argon2.
- Validation: class-validator (API DTOs) + zod (config + shared schemas).
- Config: typed config module, fail fast on missing required env at boot.
- Observability: structured JSON logging with request + tenant correlation IDs.

### Layout

```
apps/
  api/        # NestJS backend
  web/        # Next.js frontend
packages/
  db/         # TypeORM entities + migrations
  sendgrid/   # the ONLY place that talks to SendGrid
  shared/     # shared types, DTOs, enums, validation schemas
  config/     # typed env/config
docs/         # per-phase specs, ADRs, runbooks
```

## Consequences

- No code outside `packages/sendgrid` may call the SendGrid API directly
  (review-blocking anti-pattern).
- Cross-module communication in the API is via services/events, never by
  importing another module's repository.
- The EnXi design tokens are imported into `apps/web` from the design system's
  `colors_and_type.css`; we do not reinvent tokens.
