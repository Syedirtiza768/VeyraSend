# Phase 0 — Foundations & Decisions

Status: **awaiting sign-off** · Owner: engineering · Gate: see §4

## 1. Goal

Scaffold a bootable monorepo with typed config, CI, and local infrastructure
(Postgres + Redis via Docker), and ratify the architectural decisions that
cannot be cleanly reversed later. No feature code ships in this phase.

## 2. Scope

In scope:

- pnpm workspaces + Turborepo monorepo with the layout from ADR-0006.
- `apps/api` (NestJS) bootable with health check and typed config that fails
  fast on missing required env.
- `apps/web` (Next.js App Router) bootable, rendering with the EnXi design
  tokens, with a `/health` route.
- `packages/config` typed env loader (zod-validated).
- `packages/shared` shared enums and types (skeleton).
- `packages/db` TypeORM setup with `synchronize: false`, migration runner,
  base entity with `tenant_id` convention (no entities yet — Phase 1).
- `packages/sendgrid` integration wrapper skeleton (no calls yet — Phase 2).
- Docker Compose for Postgres + Redis.
- CI workflow (install, typecheck, lint, build).
- `SUPPORTED.md` initial skeleton.
- ADRs `0001`–`0006` in `docs/decisions/`.

Out of scope: any business entity, any SendGrid call, any auth flow, any UI
beyond a boot/health surface.

## 3. Deliverables

- `docs/phases/phase-0-spec.md` (this file).
- `docs/decisions/0001`–`0006`.
- `SUPPORTED.md`.
- Monorepo scaffold per ADR-0006 layout.
- `docker-compose.yml` (Postgres 16, Redis 7).
- `.env.example` documenting every required env var.
- CI: `.github/workflows/ci.yml`.
- Root `README.md` with boot instructions.

## 4. Acceptance gate

1. `pnpm install` completes clean.
2. `pnpm dev` starts both `api` (NestJS on `:4000`) and `web` (Next.js on
   `:3000`) without manual intervention.
3. `GET http://localhost:4000/health` returns `{ status: 'ok' }` and surfaces
   DB + Redis reachability.
4. `GET http://localhost:3000/health` returns `200`.
5. With a required env var removed, the API refuses to boot with a clear,
   named error (fail-fast) — no partial startup.
6. `pnpm typecheck` and `pnpm lint` pass across all workspaces.
7. TypeORM is configured with `synchronize: false`; migration runner is wired
   but no migrations exist yet.
8. `SUPPORTED.md` exists and lists every SendGrid capability from the brief
   with an initial status of `Pending` (Phases 2–9 will move them to
   Supported / Partial / Deferred / Not feasible).
9. All six ADRs are present and reference the ratified decisions.

## 5. Risks & notes

- The EnXi design system (`EnXi Design System/`) is an ERP brand system. We
  adopt its visual tokens (warm bone substrate `#FBF9F4`, graphite ink,
  cinnabar accent, hairlines, Inter + JetBrains Mono) for the product UI. The
  marketing surfaces of the design system are not used here; this is a product
  build.
- Subuser-based tenancy (ADR-0001) requires a SendGrid plan that supports
  Subusers. Until a real parent key is supplied, the integration layer runs
  in a documented mock mode so Phase 0–1 are not blocked.
