# 19 — AI Agent Execution Plan

## Read this first, in this order, before writing any code

1. `docs/REQUIREMENTS.md` and the six existing ADRs (`docs/decisions/0001`–`0006`)
   — the non-negotiable rules that predate this expansion and still govern
   it.
2. `docs/00-current-state-audit.md` — what actually exists, verified against
   source, including the two things that must be fixed before new work
   builds on top of them (hardcoded SendGrid key in `docker-compose.yml`,
   unsigned Inbound Parse webhook).
3. `docs/18-implementation-roadmap.md` — which phase you're building, its
   deliverables, and its acceptance gate.
4. The specific module doc for the area you're touching
   (`07`–`17`) and `04-database-schema.md` / `05-api-design.md` /
   `06-frontend-information-architecture.md` for the concrete shapes.
5. `docs/22-open-questions-and-decisions.md` — check whether the thing
   you're about to build has an open, unresolved fork. If it does, surface
   it and get a decision (per `docs/REQUIREMENTS.md` rule 3) rather than
   guessing.

## Hard rules (restated from the brief, binding for every phase)

- **Spec before code.** Write/update `docs/phases/phase-{N}-spec.md`
  (following the exact template of the existing `phase-0/1/2-spec.md`
  files) before implementing that phase. Get sign-off before starting.
- **Do not delete or rewrite working code to "clean it up"** unless you are
  replacing it with a better-documented structure specified in these docs
  (e.g., the `Automation`→`Workflow` migration is an explicit,
  planned replacement — that's allowed and specified; an unplanned
  refactor of `packages/sendgrid` is not).
- **Never rename an existing working route, table, or exported symbol**
  just to match this doc set's naming (see `04-database-schema.md` §0 and
  `05-api-design.md`'s "existing route groups" section) — map conceptually
  instead, exactly as those docs do.
- **Every migration is additive-first.** New tables and new nullable
  columns ship before any data migration or cleanup-drop of old structures
  (the `Automation`→`Workflow` and `InboundThread`→`Conversation`
  migrations both follow this shape explicitly in
  `18-implementation-roadmap.md`).
- **`synchronize: false` everywhere, no exceptions, ever.**
- **Tenant-scope everything.** Every new table gets `tenant_id` + RLS in
  the same migration that creates it. Every new query goes through the
  tenant-aware repository pattern. A missing tenant scope is a
  build-breaking bug, not a review comment.
- **One integration package per provider, no exceptions.** SendGrid →
  `packages/sendgrid`, Twilio → `packages/twilio`, Stripe →
  `packages/stripe`. No controller, service, or frontend code calls a
  provider SDK directly.
- **No secrets in code, logs, or committed config.** Fix the
  `docker-compose.yml` hardcoded key (`00-current-state-audit.md` §9)
  as the very first task of this expansion, independent of any phase — it
  predates and blocks nothing else, so there's no reason to sequence it
  behind Phase 12.
- **No provider credentials ever reach `apps/web`.**
- **All webhooks signature-verified before any DB write** — no exceptions
  this time (the existing Inbound Parse gap is being fixed, not repeated
  for Twilio/Stripe).
- **Every navigation item points to a real, working page.** If a phase
  ships backend before frontend, the nav item stays absent until the page
  exists — never a disabled/greyed link with no destination, never a "coming
  soon" placeholder screen.
- **No hardcoded tenant IDs anywhere**, including tests (use fixtures/
  factories that create real tenant rows, matching the existing test
  suites' pattern).
- **Update `SUPPORTED.md`-equivalent status per phase** — extend it (or add
  a Twilio/Stripe sibling doc, per `18-implementation-roadmap.md`'s closing
  note) rather than letting a second silent "actually it's more done than
  the docs say" drift accumulate, which is exactly what happened to the
  existing `docs/phases/*.md` status headers (audit §8) — don't repeat that
  mistake on the new phases.

## Suggested order of operations within a phase

For every new module, in this order: (1) migration (schema), (2) entity +
repository, (3) service with tenant-scoped methods, (4) DTOs + validation,
(5) controller + routes + `@Permissions()`, (6) tests (tenant isolation +
RBAC + the phase's specific risky-path test named in
`21-testing-strategy.md`), (7) frontend manager component + page,
(8) nav entry, (9) update the phase spec's acceptance-gate checklist,
(10) update `SUPPORTED.md`/its sibling doc.

## Definition of done for this entire expansion

Matches `01-product-vision.md`'s "Success definition" verbatim — that
paragraph is the single acceptance test for the whole roadmap, not just
prose. When every phase in `18-implementation-roadmap.md` is complete, an
agency admin can walk through that entire paragraph, live, in a fresh
environment seeded from `README.md` setup instructions, without hitting a
placeholder, a 404, a hardcoded tenant id, or an unverified webhook.

## What NOT to build without being asked again

Per `02-feature-matrix-ghl-style.md`'s "Not planned"/"Deferred" rows: no
visual drag-and-drop page builder, no WhatsApp/social DM channels, no
AI-drafted review responses, no Google Business Profile API integration,
no DNC-registry subscription, no upsell/order-form e-commerce flow, no
multi-currency rollup math, no fuzzy contact-dedup, no quick-reply
snippets library. Building any of these without a fresh explicit request is
scope creep against this plan — flag them as available future work instead,
matching the "no fake buttons, no half-finished implementations" rule.
