# 17 — Deployment & DevOps

## Current state (verified against `docker-compose.yml`, `.github/workflows/ci.yml`)

- Local/single-host Docker Compose: `postgres` (16-alpine), `redis`
  (7-alpine), `migrate` (one-shot, idempotent), `seed` (one-shot,
  idempotent, depends on `migrate` completing), `api`, `web` — each with
  health checks and correct `depends_on: condition: service_healthy`
  ordering. This is real, working deployment tooling, not aspirational.
- CI: install → typecheck → lint → build (verified against
  `.github/workflows/ci.yml`). **`pnpm test` is confirmed absent from CI** —
  the 11 existing test suites do not gate merges today. Add a test step to
  `ci.yml` as a Phase 12 day-one task (also called out in
  `21-testing-strategy.md`).
- **No staging/production environment definitions, no CD pipeline, no
  secrets manager integration** (env vars only) exist today.
- **`docker-compose.yml` has a hardcoded secret** — fix before anything
  else deployment-related (`16-security-compliance.md`).

## What this expansion requires operationally, beyond what exists

### Environment topology

Introduce three named environments explicitly (not just "local" and
"whatever prod happens to be"): `development` (current Docker Compose),
`staging` (mirrors production config, used for the fresh-env smoke test
gate that already exists per Phase 11's acceptance criteria — extend that
same discipline to every new phase), `production`. Each needs its own
`DATABASE_URL`/`REDIS_URL`/secrets, never shared.

### Secrets management

Move off plaintext `.env` files for staging/production (fine for local dev,
per `20-env-example.md`) to a real secrets manager (AWS Secrets Manager,
Doppler, Vault — pick one, don't build a custom one) before production
launch of the billing/agency layer, since at that point a leaked
`ENCRYPTION_KEY` or Twilio/Stripe credential affects real customer money
and real customer communications, not just email sends.

### Worker/API process separation

Verified: the BullMQ worker is instantiated inside the API process
(`apps/api/src/modules/queue/queue.service.ts` constructs `new Worker(...)`
directly in the NestJS service) — there is no separate worker entrypoint
today. Once
SMS/voice/workflow volume exists, decide explicitly whether to split
`apps/api` into an `api` deployable and a `worker` deployable (same
codebase, different entrypoint/command, per queue family or all queues in
one worker process) so a queue backlog doesn't degrade HTTP request
latency. This is an infra/process change, not a code architecture change —
no new ADR needed, just a `Dockerfile`/compose service addition, tracked as
a Phase 13 deployment task.

### Reverse proxy / TLS / custom domains

Production needs a reverse proxy (nginx, Caddy, or a managed load balancer)
in front of `api`/`web` for TLS termination and, starting at Phase 18
(agency white-label), custom-domain routing: an agency's custom domain
(`app.agencyname.com`) must resolve to the platform and carry enough
information (e.g., `Host` header → domain→tenant lookup table) for the API
to resolve the correct agency tenant context. Document the domain→tenant
mapping table (`04-database-schema.md` — add to `tenants` or a small
`custom_domains(domain, tenant_id)` table) and the DNS instructions a
tenant follows (CNAME to a platform-controlled hostname) in the Phase 18
spec.

### CORS origins

`CORS_ALLOWED_ORIGINS` becomes a real env-driven list (today hardcoded to
localhost) — must include the platform's own web origin plus every active
agency custom domain. This list changes dynamically as agencies add custom
domains, so CORS origin validation should check against the
`custom_domains` table at request time (with a short in-memory cache), not
a static env-var list, once Phase 18 ships. Before Phase 18, a static
env-driven list is sufficient.

### Webhook URL configuration per environment

SendGrid Event/Inbound Parse webhook URLs and Twilio number webhook URLs
must point at the correct environment's public URL — document (in each
phase's runbook, not just here) that switching environments means
re-registering webhook URLs with the provider, and that staging should use
its own SendGrid subuser/Twilio subaccount test numbers, never production
provider resources, to avoid cross-environment event bleed.

### Static asset / CDN strategy for public pages

The funnel/landing-page module (`13-forms-funnels-pages.md`) serves public,
unauthenticated pages (`/f/:slug`, `/book/:slug`) that should be fast and
cacheable. Recommendation: these routes render server-side (Next.js) with
appropriate `Cache-Control` headers (short TTL, since content can change)
rather than requiring a separate CDN/static-export pipeline — revisit only
if traffic volume on public pages becomes a measured bottleneck.

### Observability in production

Structured JSON logs exist; production needs them shipped somewhere
queryable (a log aggregator — CloudWatch, Datadog, or self-hosted
Loki/Grafana — pick one based on hosting choice, not specified further
here since it's an infra decision independent of this codebase). Add a
queue-depth dashboard (Bull Board or equivalent) at the same time workers
are split from the API process (above), since that's when queue health
becomes operationally load-bearing.

### Migration & rollback discipline (unchanged, restated)

Every schema change ships as a TypeORM migration (`synchronize: false`
everywhere, no exceptions — this expansion adds ~25 new tables and
multiple `ALTER TABLE` migrations on `contacts`/`messages`; each is its own
migration file, forward-only, with a corresponding `migration:revert` path
tested before merging, exactly as the existing 11 migrations already do).

## Explicit non-goals

No Kubernetes, no multi-region active-active, no blue/green deployment
automation specified in this document — these are legitimate future
concerns but are not blocking for reaching feature parity with the roadmap
in `18-implementation-roadmap.md`; introduce them only when real load or
uptime requirements demand it, and give that its own ADR when it happens.
