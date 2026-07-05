# 03 — System Architecture

## 1. Shape of the system

VeyraSend stays a single NestJS monolith (`apps/api`) + single Next.js
frontend (`apps/web`) + shared packages, per ADR-0006. This expansion does
**not** introduce microservices. Reasons: the existing module boundaries
(one NestJS module per bounded context, no cross-module repository imports)
already give service-like isolation without operational overhead; splitting
into separate deployables is a reversible later step if a specific module
(e.g., the workflow engine, under sustained high volume) needs independent
scaling — cross that bridge with a new ADR only when the metrics demand it.

```
                         ┌───────────────────────────┐
                         │        apps/web            │
                         │   Next.js App Router        │
                         └─────────────┬──────────────┘
                                       │ session cookie + CSRF
                         ┌─────────────▼──────────────┐
                         │        apps/api             │
                         │   NestJS, one module per     │
                         │   bounded context             │
                         └──┬───────┬───────┬───────┬──┘
             ┌──────────────┘       │       │       └───────────────┐
             ▼                      ▼       ▼                       ▼
     ┌───────────────┐     ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
     │ packages/db    │     │ packages/     │ │ packages/     │ │ packages/     │
     │ TypeORM        │     │ sendgrid      │ │ twilio (new)  │ │ stripe (new)  │
     │ entities +     │     │ (unchanged)   │ │               │ │               │
     │ migrations     │     └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
     └───────┬────────┘             │                 │                 │
             ▼                      ▼                 ▼                 ▼
     ┌───────────────┐     ┌────────────────────────────────────────────────┐
     │  PostgreSQL 16 │     │            SendGrid · Twilio · Stripe          │
     └───────────────┘     └────────────────────────────────────────────────┘

     ┌────────────────────────────────────────────────────────────────────┐
     │ BullMQ on Redis 7 — one queue family per domain (see §4)            │
     └────────────────────────────────────────────────────────────────────┘
```

## 2. Module map (existing + new)

Existing (unchanged, see `00-current-state-audit.md` §2): `auth`, `users`,
`tenants`, `rbac` (folded into auth/users today), `contacts`, `lists`,
`segments`, `templates`, `campaigns`, `messages`, `senders`, `domains`,
`suppressions`, `webhooks`, `inbound`, `events`, `analytics`, `audit`,
`settings`, `usage`, `automations` (superseded by `workflows`, see §7),
`sendgrid`, `queue`, `retention`.

New modules for this expansion:

| Module | Bounded context | Depends on |
|---|---|---|
| `companies` | Company CRUD, contact↔company link | `contacts` |
| `deals` | Deals/opportunities | `contacts`, `pipelines` |
| `pipelines` | Pipelines + stages | — |
| `tasks` | Tasks linked to contact/deal/company | `contacts`, `deals` |
| `notes` | Polymorphic notes | `contacts`, `deals`, `companies` |
| `tags` | Tag CRUD + contact tagging | `contacts` |
| `custom-fields` | Generic custom field definitions + values | — |
| `timeline` | Read-only aggregation service over audit/messages/calls/deals | all of the above |
| `conversations` | Unified conversation/message model | `contacts`, `messages`, `sms`, `calls` |
| `twilio` (integration wrapper, in `packages/twilio` not `apps/api/modules`) | Twilio API access | — |
| `phone-numbers` | Number provisioning + tenant assignment | `packages/twilio` |
| `sms` | SMS send/receive, SMS campaigns | `packages/twilio`, `conversations` |
| `voice` | Calls, recordings, voicemail, IVR/TwiML | `packages/twilio`, `conversations` |
| `workflows` | Workflow engine (triggers, actions, versioning, runs) | everything it can trigger on/act on |
| `calendar` | Calendars, availability, booking links | `contacts` |
| `appointments` | Appointment instances, reminders, no-show | `calendar`, `workflows` |
| `forms` | Form + field definitions, submissions | `contacts`, `workflows` |
| `funnels` | Funnel/landing/thank-you pages | `forms` |
| `reputation` | Review requests, review links, widgets | `contacts`, `workflows` |
| `billing` | Products, invoices, payment links, Stripe | `packages/stripe` |
| `usage-billing` (extends existing `usage`) | Cross-provider usage metering + rebilling | `packages/sendgrid`, `packages/twilio`, `packages/stripe` |
| `agency` | Sub-account hierarchy, white-label, feature flags | `tenants` |

Rule carried forward from ADR-0006: **no code outside `packages/twilio` may
call the Twilio API directly**, and **no code outside `packages/stripe` may
call the Stripe API directly**. Cross-module communication inside `apps/api`
is via services/events, never by importing another module's repository —
unchanged.

## 3. Data flow: contact-centric spine

Every inbound signal — an email reply, an SMS, a missed call, a form
submission, a booked appointment, a paid invoice — resolves to a `Contact`
first, then fans out:

```
inbound signal (email/SMS/call/form/payment)
        │
        ▼
  resolve/create Contact (tenant-scoped, by email or phone)
        │
        ├──► Conversation/Message (if a channel message)
        ├──► Timeline entry (always)
        ├──► Workflow trigger dispatch (if a matching trigger is registered)
        └──► Pipeline/Deal update (if the signal maps to a stage rule)
```

This is why the CRM core (companies/deals/pipelines/tasks/notes/tags/custom
fields) is Phase 12, first in the roadmap — every later module composes with
it rather than each inventing its own contact-adjacent state.

## 4. Queues (BullMQ on Redis 7)

Existing: `mail` queue (transactional/campaign send, 6 attempts, exponential
backoff + jitter, idempotency key). Extend with one queue per new
async-external-call domain, same pattern (idempotency key, bounded retries,
dead-letter via BullMQ's failed-job retention):

| Queue | Purpose | Attempts |
|---|---|---|
| `mail` | Existing — email send | 6 |
| `sms` | SMS/MMS send | 6, same backoff shape |
| `voice-outbound` | Outbound call initiation | 3 (calls are latency-sensitive; don't retry stale call attempts indefinitely) |
| `workflow-run` | One job per workflow-run-step; delay steps use BullMQ's `delay` option instead of polling | 5, dead-letter on exhaustion (see `09-workflow-engine.md`) |
| `webhook-dispatch` | Outbound webhook action from workflows | 6 |
| `reminder` | Appointment/review-request reminders, scheduled via `delay` | 3 |
| `usage-rollup` | Periodic per-tenant usage aggregation (cron-style repeatable job) | n/a (idempotent recompute) |
| `retention` | Existing — data retention ticker | n/a |

All queue workers run in the same `apps/api` process as today (verified:
`queue.service.ts` constructs the BullMQ `Worker` inside the NestJS
service, no separate worker entrypoint exists). If worker load grows
enough to starve the HTTP event loop post-expansion, split workers into a
separate process/deployable; that's an infra change, not an architecture
change, and doesn't require new ADRs (see `17-deployment-devops.md`).

## 5. Webhook ingestion architecture

Existing pattern (SendGrid event webhook: verify signature → dedupe by
provider event id → attribute to tenant → update local state → fan out
side effects) is the template for every new inbound webhook:

| Webhook | Route | Verification | Dedup key |
|---|---|---|---|
| SendGrid events (existing) | `POST /api/webhooks/events` | ECDSA signature | `sg_event_id` |
| SendGrid inbound parse (existing, **needs hardening** per audit §9) | `POST /api/webhooks/inbound` | Add IP allowlist + shared secret query param | best-effort (Message-Id header) |
| Twilio SMS inbound | `POST /api/webhooks/twilio/sms` | `X-Twilio-Signature` (packages/twilio validates) | Twilio `MessageSid` |
| Twilio voice status/inbound | `POST /api/webhooks/twilio/voice` | `X-Twilio-Signature` | Twilio `CallSid` |
| Stripe events | `POST /api/webhooks/stripe` | Stripe signing secret | Stripe `event.id` |

All webhook routes are `@Public()` + `@SkipCsrf()` (unauthenticated by
session, authenticated by provider signature instead) — same as today.

## 6. Multi-tenancy extension

ADR-0002 (single DB, `tenant_id` row scoping) is retained and extended, not
replaced: `Tenant` gains `parentTenantId` (nullable, self-referencing) and
`type` (`direct` | `agency` | `sub_account`). An agency's sub-accounts are
still independent rows in the same tenant-scoped tables — an agency does
**not** get implicit cross-tenant query rights; it gets an explicit,
audited "acting as sub-account X" session elevation (see
`15-saas-multitenancy-rbac.md`). This preserves the existing tenant guard/
interceptor/RLS stack unmodified for the common case and adds one
well-defined escape hatch for agency admins.

## 7. Automation → workflow engine migration

The existing `Automation`/`AutomationEnrollment` entities are not deleted in
place. Plan: (a) build the new `workflows`/`workflow_versions`/
`workflow_runs` schema alongside the old tables, (b) write a one-time
migration that converts each existing `Automation.definition` into an
equivalent single-trigger `Workflow` + `WorkflowVersion`, (c) point the
`contact.created` trigger dispatch at the new engine, (d) drop the old
tables in a later cleanup migration once the new engine has run in
production for at least one full cycle. Full detail in `09-workflow-engine.md`.

## 8. Frontend architecture shape

`apps/web` stays a single Next.js App Router app (no micro-frontends). Given
the UI surface roughly triples (19 routes → ~45+, see `06-frontend-information-architecture.md`),
introduce a thin data-fetching layer (recommend TanStack Query) at the start
of Phase 12 rather than retrofitting it later — this is the one frontend
infrastructure change recommended before new screens pile on top of the
current vanilla-`useState`-per-page pattern. No other frontend infra change
(no state manager, no component library swap) is proposed — the EnXi
CSS-variable approach and manager-component pattern scale fine to the new
screens.

## 9. Observability

Existing structured JSON logging with request+tenant correlation IDs is
extended to carry a `provider` field (`sendgrid`|`twilio`|`stripe`) and a
`workflowRunId` where applicable, so a support engineer can trace "why did
this SMS send" end-to-end across the webhook → workflow → queue → provider
call chain. A Bull Board (or equivalent) read-only queue dashboard is added
in Phase 13 (SMS/voice) since queue depth becomes operationally important
once real-time channels exist — see `18-implementation-roadmap.md` and the
technical-debt note in the audit (§8).
