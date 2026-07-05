# Changelog (Live Documentation)

> Append-only log of documentation updates and significant system changes.
> Format: date · what changed · why · files/modules affected.

---

## 2026-07-05 — Phase 18: SaaS agency layer

**What:** Tenant hierarchy (`agency`/`sub_account`), act-as elevation with audit trail, billing plans catalog, feature-flag resolution, agency usage rollup, agency admin UI.

**Why:** Roadmap Phase 18 acceptance gate — final planned phase.

**Modules:** `agency`; migrations `1700000018000`, `1700000018001`; `phase-18.spec.ts`.

---

## 2026-07-05 — Phase 17: Stripe billing

**What:** `packages/stripe`, invoices + payment links, webhook-verified payment (`checkout.session.completed`), `invoice.paid` workflow trigger, usage rollup extended with `stripe` provider metrics.

**Why:** Roadmap Phase 17 acceptance gate.

**Modules:** `billing`, Stripe webhook handler; migrations `1700000017000`, `1700000017001`; `phase-17.spec.ts`.

---

## 2026-07-05 — Phase 16: Calendar, forms, funnels, reputation

**What:** Booking calendars + public slots, forms with honeypot/rate-limit, landing pages/funnels, review request tracking; workflow triggers `appointment.booked` and `form.submitted`.

**Why:** Roadmap Phase 16 acceptance gate.

**Modules:** `calendar`, `forms`, `funnels`, `reputation`; migrations `1700000016000`, `1700000016001`; `phase-16.spec.ts`.

---

## 2026-07-05 — Phase 15: Workflow engine

**What:** Full workflow schema + BullMQ engine, trigger dispatch from contacts/tags/deals/webhooks/SMS/voice, `/api/workflows` CRUD/publish/test-run, `/workflows` UI, automations API read-only, missed-call migrated to `call.missed` trigger.

**Why:** Roadmap Phase 15 acceptance gate (`09-workflow-engine.md`).

**Modules/packages:** `workflows`; migrations `1700000015000`, `1700000015001`; `apps/api/test/workflows-phase.spec.ts`; `workflows-manager.tsx`.

---

## 2026-07-05 — Live documentation sync (Phases 12–14)

**What:** Rewrote stale live docs to match codebase after CRM, Twilio, and conversations phases.

**Why:** `docs/live/*` still described pre-P12 state while `system-context.md` was ahead.

**Files updated:**

- `docs/live/01-system-overview.md` — 36 modules, Twilio live, expanded purpose
- `docs/live/03-technical-reference.md` — webhooks, Twilio rules, 14 test suites, updated debt
- `docs/live/04-api-reference.md` — CRM, Twilio, conversations routes; full permissions; fixed planned list
- `docs/live/05-database.md` — 42 entities, 17 migrations, CRM/Twilio/conversations catalog
- `docs/live/06-frontend-backend-sync.md` — all routes, corrected gaps/mismatches
- `docs/live/README.md` — index + stale-audit warning
- `docs/system-context.md` — consistent entity/module/route counts

---

## 2026-07-05 — Phase 14: Unified conversations inbox

**What:** `conversations` + `conversation_notes` tables, channel adapters for email/SMS/voice, `/api/conversations` API, `/conversations` UI with channel filters, `/inbox` redirect, inbound data migration, contact timeline includes messages.

**Why:** Roadmap Phase 14 acceptance gate (`10-conversations-inbox.md`).

**Modules/packages:** `conversations`; migrations `1700000014000`, `1700000014001`; `apps/api/test/conversations-phase.spec.ts`; `conversations-manager.tsx`.

---

## 2026-07-05 — Phase 13: Twilio SMS/voice + inbound parse hardening

**What:** Twilio subaccount provisioning, phone numbers, SMS send/receive with STOP/START, call log + webhooks, inbound parse secret, `/phone-numbers` and `/calls` UI.

**Why:** Roadmap Phase 13 acceptance gate (ADR-0007).

**Modules/packages:** `packages/twilio`, `twilio`, `phone-numbers`, `sms`, `voice`, `webhooks`; migrations `1700000013000`, `1700000013001`; `apps/api/test/twilio-phase.spec.ts`.

---

## 2026-07-05 — Initial live documentation layer

> **Historical snapshot** — counts below reflect Phases 0–11 only. Superseded by entries above.

**What:** Created the live system documentation layer from full codebase analysis.

**Why:** Establish a single source of truth that reflects actual implementation, separate from GHL-expansion planning docs.

**Files created:**

- `docs/system-context.md` — master AI-agent context file
- `docs/live/README.md` — index
- `docs/live/DOCUMENTATION_RULES.md` — maintenance rules
- `docs/live/01-system-overview.md`
- `docs/live/02-features.md`
- `docs/live/03-technical-reference.md`
- `docs/live/04-api-reference.md`
- `docs/live/05-database.md`
- `docs/live/06-frontend-backend-sync.md`
- `docs/live/CHANGELOG.md`

**Files updated:**

- `README.md` — pointer to `docs/system-context.md`

**System state documented (no code changes):**

- 23 NestJS backend modules, ~80 API routes under `/api`
- 20 frontend routes (+ `/login`, `/health`, `/`)
- 23 database entities, 11 migrations
- SendGrid integration live; Twilio/Stripe absent
- Phases 0–11 complete (email platform)
- Known gaps: inbound webhook signature, list member UI, automation enum types partially wired, dashboard stale copy

**Known limitations noted:**

- Inbound Parse webhook lacks authenticity verification
- `users:delete` and `tenants:write` permissions defined but no routes
- Planning docs (`PHASE_PLAN.md`, `SUPPORTED.md`, `docs/phases/*.md`) have stale status headers vs. code

**Pending work (Planned, not in code):**

- Phase 12+ CRM core, Twilio, workflows, calendar, forms, billing, agency layer — see `docs/18-implementation-roadmap.md`
