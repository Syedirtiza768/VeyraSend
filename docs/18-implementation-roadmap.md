# 18 — Implementation Roadmap

## Numbering

The existing platform completed Phases 0–11 (`docs/PHASE_PLAN.md`). This
expansion continues the same numbering starting at **Phase 12** — it is not
a renumbered "Phase 0," and it does not restart the phase-gate discipline,
it extends it. Each phase below still gets its own
`docs/phases/phase-{N}-spec.md` (written when that phase starts, following
the exact template of `phase-0-spec.md`/`phase-1-spec.md`/`phase-2-spec.md`),
signed off before implementation, per `docs/REQUIREMENTS.md` rule 1–2.

Mapping to the brief's phase names: Phase 12 = brief's "CRM Core," Phase 13
= "Twilio SMS and Phone," Phase 14 = "Unified Conversations," Phase 15 =
"Workflow Engine," Phase 16 = brief's "Calendar and Booking" **and** "Forms,
Funnels, Reputation" bundled together (rationale below), Phase 17 =
"Payments, Invoices, Proposals" (present in the brief's product-goal
section but not its roadmap section — added here as its own phase since it
has a distinct provider integration, Stripe), Phase 18 = "SaaS Agency
Layer." Brief's "Phase 0 — Repo Audit and Foundation" and "Phase 2 —
SendGrid Email System" are **already complete** (this doc set *is* the
audit + foundation deliverable; SendGrid is Phases 2–11 of the existing
plan) — not repeated as new phases.

Why Phase 16 bundles calendar + forms/funnels/reputation: both are
"new small entity + a public unauthenticated page + a workflow trigger"
shaped modules with no dependency on each other, both depend only on the
CRM core (P12) and workflow engine (P15) being done, and splitting them
into two full phase-gate cycles adds process overhead without a real
sequencing reason. If team capacity suggests splitting them into 16a/16b
sub-phases with separate sign-off, that's a scheduling choice, not an
architecture one — do it if useful.

## Phase 12 — CRM Core

**Deliverables**: `companies`, `pipelines`, `pipeline_stages`, `deals`,
`tasks`, `notes`, `tags`, `contact_tags`, `custom_fields`,
`custom_field_values` tables + modules; `contacts` extended
(`company_id`, `owner_user_id`, `lead_source`, `lifecycle_stage`, `phone`);
contact timeline read endpoint; pipeline Kanban UI; contact detail page.

**Database changes**: 10 new tables + 1 `ALTER TABLE contacts` migration,
per `04-database-schema.md` §2. Each ships as its own migration file.

**Backend tasks**: `companies`, `deals`, `pipelines`, `tasks`, `notes`,
`tags`, `custom-fields` modules (routes in `05-api-design.md`); polymorphic
entity-existence validation for `tasks`/`notes` (`11-crm-pipelines.md`);
CSV import extended for company/tag columns; add `pnpm test` (with
Postgres/Redis service containers) to `.github/workflows/ci.yml`
(`21-testing-strategy.md`); reconcile or delete the unused
`packages/shared` enums whose values don't match runtime literals
(`AutomationTriggerType`/`AutomationActionType`/`CampaignState` — see
`00-current-state-audit.md` §8).

**Frontend tasks**: `/companies`, `/companies/[id]`, `/contacts/[id]`,
`/pipelines`, `/deals/[id]`, `/tasks` (per `06-frontend-information-architecture.md`);
introduce TanStack Query for these new screens.

**Test cases**: tenant isolation on every new table (mirrors existing
`tenant-isolation.spec.ts` pattern); pipeline-stage full-replace atomicity;
deal `/move` triggers audit log entry; polymorphic entity-existence
rejection (task pointing at a nonexistent contact → `400`); RBAC on every
new permission string.

**Acceptance gate**: a user creates a company, links contacts to it,
builds a pipeline with stages, creates a deal, drags it across stages on
the Kanban board, adds a task and a note, tags a contact, and sees all of
it reflected in that contact's timeline — tenant-isolated, RBAC-enforced,
migration-driven.

## Phase 13 — Twilio SMS & Phone + Inbound Parse Hardening

**Deliverables**: `packages/twilio` (mirrors `packages/sendgrid`);
`phone_numbers`, `calls`, `call_recordings`, `voicemail_messages`,
`twilio_events`, `tenant_twilio_settings`, `usage_records` tables (Twilio
usage/cost logging per tenant starts here — Stripe metrics join in P17,
rollup/rebilling UI in P18); SMS/MMS send+receive; voice call log +
recording + voicemail; missed-call text-back (as a seeded workflow — see
Phase 15 dependency note below); STOP/START compliance; SMS campaigns
(existing `campaigns` table + screen gain a `channel` dimension —
`04-database-schema.md`, `06-frontend-information-architecture.md`);
email A/B testing
(`07-sendgrid-integration.md` gap #2 — campaign variants, per-recipient
assignment, per-variant stats); **and** the SendGrid Inbound Parse
signature/allowlist fix (`16-security-compliance.md`) since it must land
before Phase 14.

**Database changes**: 7 new tables per `04-database-schema.md` §4/§9/
"usage & billing" + `ALTER TABLE campaigns` (A/B `variants` column +
`channel` column for SMS campaigns) + `ALTER TABLE messages`
(`variant_key`), new ADR for Twilio Subaccount
model (mirrors ADR-0001, see `22-open-questions-and-decisions.md`).

**Backend tasks**: `phone-numbers`, `sms`, `voice` modules; `sms` and
`voice-outbound` BullMQ queues; Twilio webhook handlers with mandatory
signature verification from day one.

**Frontend tasks**: `/phone-numbers`, `/calls`.

**Test cases**: Twilio webhook signature rejection on tampered payload;
opt-out (STOP) blocks subsequent sends (`422`); mock-mode SMS/voice flow
works end-to-end without real Twilio credentials, mirroring the existing
SendGrid mock-mode test pattern.

**Acceptance gate**: a tenant buys a number, sends/receives SMS,
places/receives a call with recording and voicemail-on-no-answer, a
STOP reply blocks further sends, and the Inbound Parse webhook now
rejects unsigned/non-allowlisted requests (regression test against the
audit's flagged gap).

**Note on missed-call text-back sequencing**: this feature is *defined*
as a workflow (Phase 15), but Phase 13 needs *some* form of it to be
demoable per the brief's phase table. Resolution: ship Phase 13 with a
simple hardcoded trigger→action wire (no general workflow engine yet) as
a stopgap, then migrate it to a real workflow definition in Phase 15
alongside the `Automation`→`Workflow` migration — call this out explicitly
in the Phase 13 spec so it's understood as temporary, not a second
permanent automation mechanism.

## Phase 14 — Unified Conversations

**Deliverables**: `conversations` table; `messages` extended
(`conversation_id`, `channel`, `direction`, `provider_message_id`); unified
inbox UI; migration of existing `InboundThread`/`InboundMessage` data into
the new model; `/inbox` → `/conversations` redirect.

**Database changes**: 1 new table + `ALTER TABLE messages` + one-time data
migration script (existing inbound data → `conversations`/`messages`).

**Backend tasks**: `conversations` module (routes in `05-api-design.md`);
channel-adapter contract implemented for email/SMS/voice per
`10-conversations-inbox.md`.

**Frontend tasks**: `/conversations` (replaces `/inbox`).

**Test cases**: a reply via a different channel than the thread's primary
channel still lands in the same conversation; migrated inbound data is
queryable and matches pre-migration counts (data-integrity test, not just
schema test).

**Acceptance gate**: one contact's email reply, SMS, and a missed call all
appear in one conversation thread, filterable by channel, assignable, with
correct per-channel status tracking.

## Phase 15 — Workflow Engine

**Deliverables**: full schema + engine per `09-workflow-engine.md`;
migration of existing `Automation` data into `Workflow`/`WorkflowVersion`;
trigger/action registries wired to every module that emits/consumes them;
structured step-list builder UI; safe test-run mode.

**Database changes**: `workflows`, `workflow_versions`,
`workflow_triggers`, `workflow_actions`, `workflow_runs`,
`workflow_run_steps` + data migration from `automations`/
`automation_enrollments`, then a follow-up cleanup migration dropping the
old tables once stable.

**Backend tasks**: `workflows` module; `workflow-run`, `webhook-dispatch`,
`reminder` queues; dispatcher service called from every trigger-emitting
module (contacts, tags, deals, webhooks, forms — forms module itself lands
Phase 16, so its trigger wiring is a small addition then, not blocking
Phase 15).

**Frontend tasks**: `/workflows` (list, step-list builder, run log).

**Test cases**: idempotent step execution under redelivery; delay-step
resumption after process restart (durability test); dry-run mode makes
zero real provider calls (assert via mock-mode call-count); published
version pinning (editing a draft mid-run doesn't alter the in-flight run).

**Acceptance gate**: brief's own gate — "a welcome sequence with delay +
branch runs end-to-end" — now generalized across trigger types, plus the
missed-call-text-back stopgap from Phase 13 is migrated into a real
workflow.

## Phase 16 — Calendar, Booking, Forms, Funnels, Reputation

**Deliverables**: `calendars`, `appointments`, `forms`, `form_fields`,
`form_submissions`, `landing_pages`, `funnels`, `funnel_steps`,
`review_requests` tables; public booking flow; structured page/funnel
builder; embeddable form/testimonial widgets; review request send + link
tracking.

**Database changes**: 9 new tables per `04-database-schema.md` §6/§7/§8.

**Backend tasks**: `calendar`, `appointments`, `forms`, `funnels`,
`reputation` modules; public unauthenticated routes with rate limiting
(`16-security-compliance.md`); `appointment.booked`/`form.submitted`
workflow trigger wiring.

**Frontend tasks**: `/calendar`, `/appointments`, `/book/[slug]` (public),
`/forms`, `/funnels`, `/f/[slug]` (public), `/reputation`.

**Test cases**: public booking respects availability + buffer rules and
is rate-limited; form submission with spam-honeypot filled is rejected but
still logged; funnel page renders unpublished page as "not available," not
a raw 404.

**Acceptance gate**: brief's own gates — booking link produces a real
appointment with reminders sent, a form submission creates/updates a
contact with UTM attribution, a review request is sent and its link click
tracked.

## Phase 17 — Payments, Invoices, Proposals

**Deliverables**: `packages/stripe`; `invoices`, `payment_links`,
`tenant_stripe_settings` tables; invoice send with payment link; text-to-pay
via SMS (depends on Phase 13); `invoice.paid` workflow trigger; usage/cost
rollup (`usage_records`) extended to cover Stripe alongside
SendGrid/Twilio.

**Database changes**: 3 new tables + Stripe ADR (Connect vs. platform
account — `22-open-questions-and-decisions.md`).

**Backend tasks**: `billing` module; Stripe webhook handler
(mandatory signature verification from day one).

**Frontend tasks**: `/invoices`, `/payment-links`.

**Test cases**: Stripe webhook signature rejection; invoice status
transitions only via webhook-confirmed payment, never client-asserted.

**Acceptance gate**: an invoice is created, sent, paid via Stripe, and the
`invoice.paid` trigger fires a workflow.

## Phase 18 — SaaS Agency Layer

**Deliverables**: `tenants` extended (`parent_tenant_id`, `type`,
`white_label_config`); agency roles + "act as" elevation
(`15-saas-multitenancy-rbac.md`); `billing_plans`, `feature_flags`,
`usage_records` cross-provider rollup; agency admin UI.

**Database changes**: `ALTER TABLE tenants` + `billing_plans`,
`feature_flags` tables (already covered by `usage_records` from Phase
17/13).

**Backend tasks**: `agency` module; act-as elevation endpoint with
mandatory audit logging; feature-flag resolution service
(tenant → plan → global fallback).

**Frontend tasks**: `/agency/sub-accounts`, `/agency/branding`,
`/agency/billing-plans`, `/agency/feature-flags`; persistent act-as banner.

**Test cases**: a sub-account's data remains invisible to sibling
sub-accounts under the same agency (isolation test, not just "isolated
from unrelated tenants" — the harder case is siblings under one parent);
act-as elevation is fully audited (start + end events); an agency cannot
nest a sub-account under another sub-account (`400`).

**Acceptance gate**: brief's own definition-of-done for this layer — an
agency admin creates a sub-account, acts as it, configures its
SendGrid/Twilio settings, and sees usage roll up at the agency level with
rebilling math applied.

## After Phase 18

Re-run `SUPPORTED.md`-style honesty pass across the whole platform (not
just SendGrid) — rename/restructure it or add a sibling document covering
Twilio/Stripe capability gaps with the same status vocabulary
(Supported/Partial/Deferred/Not feasible/Pending), so the "living gap
analysis" discipline extends to the whole product, not just the email
subsystem it was written for.
