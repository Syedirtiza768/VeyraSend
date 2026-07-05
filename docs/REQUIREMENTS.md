# REQUIREMENTS — SendGrid Email Campaign & Management Platform

This is the canonical brief, retained verbatim as the contract for the build.
The phased plan that operationalizes these requirements lives in
`docs/PHASE_PLAN.md`; per-phase specs live in `docs/phases/`. Architecture
decisions are recorded in `docs/decisions/`.

## Mission

A production-grade, multi-tenant Email Campaign & Email Management Platform on
top of the SendGrid Web API. A logged-in business operates the full email
lifecycle — configure SendGrid, manage senders/domains, build templates, import
contacts, run campaigns, send transactional and bulk mail, receive replies,
manage conversations, build automations, and track delivery/engagement —
without ever logging into SendGrid directly.

## Non-negotiable operating rules

1. **Spec before code.** Each phase starts with a written spec in `docs/`,
   approved before implementation.
2. **Hard phase gates.** No phase N+1 until phase N acceptance criteria are met
   and signed off.
3. **Decide, don't assume.** Architectural forks are surfaced with a
   recommendation and recorded in `docs/decisions/`.
4. **No secrets in code or logs.** Keys live only in env/secret store, encrypted
   at rest. Never echo a key, even masked.
5. **Tenant-scope everything.** Every query, endpoint, queue job, and webhook
   handler is tenant-aware. A missing tenant scope is a build-breaking bug.
6. **Migrations, not auto-sync.** TypeORM migrations only. `synchronize: false`
   everywhere, including dev.
7. **Defensive external calls.** All SendGrid calls go through one integration
   layer with retry, backoff, timeout, rate-limit handling, idempotency keys.
8. **Honesty about limits.** Constraints are documented in `SUPPORTED.md`
   rather than faked.
9. **Test the risky parts.** Webhook signatures, tenant isolation, queue retry,
   suppression handling, automation branching.
10. **Keep `SUPPORTED.md` current.** Living gap analysis, updated per phase.

## Stack (ratified in ADR-0006)

pnpm workspaces + Turborepo · NestJS · Next.js (App Router) · PostgreSQL via
TypeORM (migrations only) · BullMQ on Redis · session-cookie auth + CSRF ·
class-validator/zod validation · typed config · structured logging with
correlation IDs.

## Backend module map

auth · users · tenants · rbac · sendgrid-integration · senders-domains ·
email-send · templates · contacts · lists-segments · suppressions · campaigns ·
automations · inbound-inbox · webhooks · analytics · settings · admin · audit ·
usage-billing

## Phased plan summary

- Phase 0 — Foundations & Decisions
- Phase 1 — Auth, Tenancy, RBAC, Users
- Phase 2 — SendGrid Integration Layer + Senders/Domains
- Phase 3 — Transactional Send Core + Event Webhooks
- Phase 4 — Contacts, Lists, Segments, Suppressions
- Phase 5 — Templates
- Phase 6 — Campaigns
- Phase 7 — Inbound / Inbox
- Phase 8 — Automations
- Phase 9 — Analytics & Dashboards
- Phase 10 — Admin, Settings, Audit, Usage/Billing, Retention
- Phase 11 — Hardening & Handoff

## Definition of done

A user logs in, configures SendGrid, manages senders/domains, creates versioned
templates, imports and segments contacts, builds and schedules campaigns, sends
transactional and bulk mail, receives and replies to threaded inbound mail,
builds running automations, tracks delivery/engagement honestly, manages
unsubscribes/suppressions, and views analytics — all tenant-isolated, secure,
queue-backed, migration-driven, documented, and deployable from the runbook,
with `SUPPORTED.md` accurately reflecting what is and isn't covered by SendGrid.
