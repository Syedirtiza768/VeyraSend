# 22 — Open Questions & Decisions

Consolidates every fork flagged across `docs/07`–`21` that needs an
explicit decision (recorded as a new ADR where the brief's own rule 3
applies — "architectural forks are surfaced with a recommendation and
recorded in `docs/decisions/`") rather than being silently assumed. Each
entry below states the recommendation already given inline in its source
doc, so a reviewer can ratify-or-override quickly instead of starting from
zero.

## Immediate action item (not a fork — just do it)

**Rotate the SendGrid parent API key hardcoded in `docker-compose.yml`**
and fix the file to read `${SENDGRID_PARENT_API_KEY:-}`. See
`00-current-state-audit.md` §9 and `16-security-compliance.md`. This
blocks nothing else and should happen immediately, independent of phase
sequencing.

## Decisions needed before the phase that depends on them starts

| # | Question | Recommendation given | Blocks |
|---|---|---|---|
| 1 | ~~Twilio integration model~~ — **RESOLVED**: `docs/decisions/0007-twilio-integration-model.md` is Accepted (parent account + Subaccount per tenant, `tenant_twilio_settings` with the shared AES-256-GCM `ENCRYPTION_KEY`, `packages/twilio` as sole caller, mock mode default, mandatory `X-Twilio-Signature` verification) — matches the recommendation in `08-twilio-integration.md` | — | Ratified |
| 2 | Stripe integration model for agency rebilling — Stripe Connect (each tenant/agency has its own connected Stripe account, platform takes an application fee) vs. platform-owned Stripe account with internal ledger-based rebilling | Recommend Stripe Connect for agencies that want funds to land in their own bank account; platform-account-only is simpler but means the platform legally handles all funds pass-through — this is a business/legal decision as much as technical, surface to stakeholders explicitly, don't default silently | Phase 17 |
| 3 | `feature_flags` global-default representation when `tenant_id` is null — partial unique index (`WHERE tenant_id IS NOT NULL`) plus a separate single-row-per-key global default, or a sentinel UUID for "global"? | Recommend the partial-unique-index approach (cleaner NULL semantics, standard Postgres pattern) over a sentinel UUID (easy to accidentally match against in a naive query) | Phase 18 |
| 4 | ADR-0004 (Inbound Parse replies only, not a general inbox) — the *email-channel-specific* technical constraint it describes is still true, but the product-level framing ("not a general inbox") is superseded once SMS/voice join the same UI in Phase 14. | Write ADR-0008 explicitly superseding ADR-0004's product-level framing while keeping its email-specific technical content intact (`10-conversations-inbox.md` already states what carries forward) | Phase 14 |
| 5 | ADR-0005 (marketing/transactional subsystem split) — does an SMS analog of "Marketing Campaigns API vs. Mail Send API" exist? Twilio has no equivalent to SendGrid's separate Marketing Campaigns contacts API — SMS sending is a single API surface. | Recommend: ADR-0005 does **not** need superseding, it's SendGrid-specific and stays correct as written; document (in the Phase 13 spec) that the split simply doesn't apply to SMS rather than forcing a symmetric ADR | Phase 13 spec |

## Deferred / revisit only if a real signal appears (do not build speculatively)

| # | Question | Recommendation | Revisit trigger |
|---|---|---|---|
| 6 | `custom_fields`/`custom_field_values` vs. the existing `contacts.custom_fields` jsonb — backfill old data into the new mechanism, or let both coexist indefinitely? | Let both coexist (new UI reads new mechanism, old data stays queryable as-is) until a concrete need for a unified query surface appears | A reporting/segment feature needs to query both uniformly |
| 7 | `email_campaign_recipients` — materialize a per-recipient snapshot table independent of `messages`, or keep resolving recipients from the segment at send time only? | Keep current (no materialized table) — add only if campaign-recipient auditing independent of delivery status becomes a real requirement | A compliance/audit need for "who was targeted" separate from "who was sent to" |
| 8 | API versioning (`/api/v1`) — introduce now while the API surface roughly triples, or continue unversioned? | Continue unversioned through Phase 18; only introduce versioning when a genuinely external/public API consumer exists (e.g., agency-facing public API), since versioning a purely-internal API adds ceremony with no current benefit | A public API product is scoped |
| 9 | Websocket/SSE for Conversations inbox and Workflow run status, vs. polling (current recommendation) | Ship polling first (`06-frontend-information-architecture.md`, `10-conversations-inbox.md`) | Real user complaints about inbox/run-status latency post-launch |
| 10 | Per-user read-cursor on conversations vs. single shared `unread` boolean | Ship the single shared flag first | Multiple agents commonly work the same conversation and step on each other's read state |
| 11 | Conversation/campaign visibility restricted to the assigned/owning user vs. tenant-wide visibility (current assumption, matches existing contacts/inbox behavior) | Keep tenant-wide visibility, assignment as routing aid only | Target customer feedback indicates a need for restricted visibility (e.g., large sales teams wanting privacy between reps) |
| 12 | Call recording storage — left on Twilio's own media URLs (current recommendation) vs. pulled and re-hosted on platform storage | Leave on Twilio-hosted URLs | A specific retention/compliance requirement mandates platform-controlled storage and retention period |
| 13 | `DEFAULT_FROM_EMAIL`/`DEFAULT_FROM_NAME` — add a platform-level system sender identity (e.g., for future password-reset transactional mail) | Don't add speculatively; today every send is per-tenant-sender scoped and there's no platform-level transactional mail yet | A feature needing platform-originated email (e.g., password reset, billing receipts) is scoped |
| 14 | White-label config — allow a sub-account to override its parent agency's branding, or enforce uniform agency branding across all sub-accounts (current recommendation) | Enforce uniform branding (simpler mental model, matches typical agency-reseller expectations) | An agency customer explicitly requests per-client branding variance |
| 15 | Duplicate contact detection — fuzzy/phone-normalized matching beyond the existing exact-email-unique + exact-phone-match | Defer; ship exact-match only | Data quality complaints from real usage at scale |
| 16 | Worker/API process separation (BullMQ workers split from the HTTP API process) | Keep in-process until queue volume from SMS/voice/workflows measurably degrades HTTP latency | Observed latency degradation or queue backlog under real load |
| 17 | `TWILIO_WEBHOOK_AUTH_TOKEN` as a distinct config value vs. reusing `TWILIO_AUTH_TOKEN` directly for signature validation | Confirm during the Phase 13 spec once the exact Twilio signature-validation call is implemented against real/sandbox credentials — don't guess ahead of the library's actual requirement | Phase 13 implementation |
| 18 | AI-drafted review responses, Google Business Profile API integration, DNC-registry subscription, visual drag-and-drop page builder, upsell/order-form flows, multi-currency rollup, quick-reply snippets | All explicitly out of scope per `02-feature-matrix-ghl-style.md` | Only on a fresh, explicit request — not inferred from this brief |

## Process/documentation hygiene items

| # | Question | Recommendation |
|---|---|---|
| 19 | `docs/PHASE_PLAN.md` and `docs/phases/phase-{0,1,2}-spec.md` have stale status headers ("awaiting sign-off"/"in progress") that don't match the actually-complete, tested code | Do a documentation refresh pass on these three files independent of this expansion — quick, low-risk, prevents future confusion (this audit had to explicitly verify against source code to resolve the discrepancy; a future reader shouldn't have to) |
| 20 | `SUPPORTED.md` is SendGrid-specific and already somewhat stale relative to code | Either extend it to cover Twilio/Stripe capability status too, or create a sibling doc (`SUPPORTED_TWILIO.md`/`SUPPORTED_STRIPE.md`) with the same status vocabulary — decide the format once, before Phase 13 needs its first entry |

## Decision log discipline going forward

Every row promoted from "deferred" to "in progress" gets its own ADR in
`docs/decisions/` (numbered continuing from the existing 0001–0006 —
suggested new ADR numbers 0007+ are assigned to items 1, 2, and 4 above
when their phase starts), following the exact format of the existing six
ADRs (Context / Decision / Consequences). Do not resolve a forked decision
by silent implementation choice — this document exists specifically so
that doesn't happen.
