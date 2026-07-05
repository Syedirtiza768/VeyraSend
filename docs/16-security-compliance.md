# 16 — Security & Compliance

## Immediate: rotate the SendGrid key hardcoded in `docker-compose.yml`

`docker-compose.yml` line 9 hardcodes a real-looking SendGrid parent API key
in plaintext (`SENDGRID_PARENT_API_KEY: "SG.hmqnetZ9S96kMRJwldHsrw..."`)
instead of sourcing it from an env var like every sibling secret in the same
file does. This is a live secret sitting in a working-tree file, in direct
violation of the platform's own "no secrets in code" rule. Action: rotate
the key in the SendGrid dashboard now, and fix the compose file to read
`${SENDGRID_PARENT_API_KEY:-}` before this repo's first commit. This is not
a new-module concern — it applies to the codebase as it exists today,
independent of this expansion, and takes priority over any of the new work
in this document. See `00-current-state-audit.md` §9.

## Already solid (verified in code, keep as-is)

Session-cookie auth (`HttpOnly`+`Secure`+`SameSite=Lax`, Redis-backed,
rotating id on login), double-submit CSRF, argon2id password hashing,
tenant RLS + guard/interceptor stack, encrypted-at-rest provider credentials
(AES-256-GCM), audit logging of state-changing actions, SendGrid event
webhook signature verification. These patterns are the template every new
module below follows — this doc calls out what's **new or currently
missing**, not a re-explanation of what already works (see
`00-current-state-audit.md` §9 for the as-found list).

## Fix before building on top of it: Inbound Parse signature gap

Restated from the audit because it blocks the Conversations Inbox
specifically: `POST /api/webhooks/inbound` currently has no authenticity
check. Remediation (Phase 13, sequenced before Phase 14's unified inbox):
IP allowlist (SendGrid's published ranges) at the infra/reverse-proxy layer
+ a shared-secret query parameter (`SENDGRID_INBOUND_PARSE_SECRET`,
`07-sendgrid-integration.md`) checked in the handler. Do not treat this as
optional hardening — an unauthenticated endpoint that can inject fake
"customer replies" becomes a trust problem the moment it feeds workflow
triggers and a CRM timeline that sales reps act on.

## Webhook signature verification — provider matrix

| Provider | Mechanism | Status |
|---|---|---|
| SendGrid event webhook | ECDSA signature | Live |
| SendGrid inbound parse | None → IP allowlist + shared secret | Gap, fix in Phase 13 |
| Twilio SMS/voice webhooks | `X-Twilio-Signature` HMAC | Mandatory from day one of Phase 13 — do not repeat the SendGrid inbound gap on a brand-new integration |
| Stripe webhooks | Stripe signing secret | Mandatory from day one of Phase 17 |

Every new webhook handler must verify signature **before** any DB write,
and reject (`403`) on failure without leaking whether the resource being
referenced exists.

## Rate limiting

Not implemented anywhere today (audit §9). Add, in order of urgency:

1. `POST /api/auth/login` — brute-force throttle (e.g., per-IP + per-email
   sliding window).
2. Public unauthenticated write endpoints introduced by this expansion:
   `POST /api/appointments` (booking), `POST /api/forms/:id/submit`, the
   public booking-slot read endpoint. These are new attack surface this
   expansion creates, so their rate limits ship in the same phase as the
   endpoint, not retrofitted later.
3. Webhook endpoints — rate-limit as a defense-in-depth measure even though
   they're also signature-verified (a compromised or misbehaving provider
   integration shouldn't be able to overwhelm the queue).

Implementation: a Redis-backed sliding-window limiter (Redis is already a
hard dependency) — no new infrastructure needed.

## CORS

Currently hardcoded to `localhost:3000`/`localhost:3040` — must become
environment-driven (`CORS_ALLOWED_ORIGINS`) before any non-localhost
deployment, including the agency custom-domain feature (§15), which needs
multiple allowed origins (platform domain + each agency's white-label
domain). Detailed in `17-deployment-devops.md`.

## Encryption & secret rotation

Existing `ENCRYPTION_KEY` (AES-256-GCM) is reused for the new
`tenant_twilio_settings.encrypted_auth_token` and
`tenant_stripe_settings.encrypted_api_key` — **do not** introduce a second
encryption key/scheme per provider; one key, one scheme, for all
provider-credential-at-rest encryption. No rotation tooling exists today
for `SESSION_SECRET`/`ENCRYPTION_KEY`/the SendGrid parent key; a rotation
runbook (not necessarily automated tooling) should exist before production
launch of the agency/billing layer, since a compromised parent-level
credential at that point affects every tenant, not one.

## PII handling

New PII surfaces introduced by this expansion: phone numbers (contacts,
calls), call recordings/voicemails (audio containing whatever was said —
potentially sensitive), payment data (kept out of the platform's own DB
entirely — Stripe Checkout/Payment Links means card data never touches
VeyraSend's servers, satisfying PCI SAQ-A scope, not a heavier PCI
requirement). Call recordings/voicemail audio files are stored via
Twilio's own media URLs by default (not re-hosted on platform
infrastructure) unless a retention/compliance reason requires pulling and
storing them platform-side — if that requirement emerges, add it as an
explicit decision (storage location, encryption, retention period) in
`22-open-questions-and-decisions.md`, don't default into re-hosting media
without deciding the retention policy first.

## Call recording consent

Recording consent laws vary by jurisdiction (one-party vs. two-party
consent). The platform's obligation: (a) make it easy for a tenant to
enable a recording announcement (`<Say>` before `<Record>` in the TwiML,
configurable on/off per tenant), (b) document clearly in tenant-facing
settings that **the tenant, not the platform, is responsible for
complying with their jurisdiction's consent law** — the platform provides
the mechanism (announcement toggle), not legal compliance itself. State
this ownership boundary explicitly in the Settings UI copy, not just in
internal docs.

## SMS/DNC/TCPA

Detailed in `08-twilio-integration.md` — opt-in required before first send,
opt-out (STOP/START) honored at both the Twilio-carrier level and the
platform level, consent timestamps logged. Explicitly **not** an automated
DNC-registry subscription (that's a distinct paid data feed, out of scope
unless requested) — document this scope boundary in the same place the
tenant configures SMS sending, so it's not assumed to be handled when it
isn't.

## Role-based access to conversations & campaigns

`conversations:read`/`write` and `campaigns:read`/`write` follow the
existing `@Permissions()` pattern exactly. One new consideration:
conversation **assignment** — should a `member` role see only conversations
assigned to them, or all tenant conversations? Recommendation: all tenant
conversations are visible to any role with `conversations:read` (matches
how the existing inbox/contacts work — visibility is tenant-wide, not
per-user, today), with assignment as a workflow-routing aid, not an access
boundary. If per-user visibility restriction is wanted later, it's an
additive filter, not a breaking change — flag as an open question if this
assumption is wrong for the target customer base.

## Input validation / CSRF / XSS

Unchanged conventions apply to every new DTO (`class-validator` +
`zod`). One new XSS surface: the structured page/funnel builder
(`13-forms-funnels-pages.md`) renders tenant-authored text content
(headlines, testimonial quotes) on public pages — sanitize/escape on
render (React's default escaping covers plain text; any rich-text field
must go through an explicit sanitizer, never `dangerouslySetInnerHTML`
on raw tenant input).
