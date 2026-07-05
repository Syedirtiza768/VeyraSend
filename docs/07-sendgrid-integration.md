# 07 — SendGrid Integration

## Status: mostly already built. This doc separates "already correct, keep
as-is" from "gaps to close as part of this expansion."

## Already implemented (verified against source, see `00-current-state-audit.md`)

| Capability | Where | Notes |
|---|---|---|
| API key management | `packages/sendgrid`, `tenant_sendgrid_settings` | Parent key (platform) + per-tenant Subuser key, AES-256-GCM encrypted at rest, never logged (`redactedConfig`) |
| Sender identities | `senders` module/table | Single Sender Verification mirror: create/list/delete/resend-verification |
| Domain authentication | `domains` module/table | DKIM/SPF record retrieval + verify |
| Email sending service | `messages` module + `mail` BullMQ queue | Transactional + campaign send, idempotency key, 6 retries w/ exponential backoff + jitter |
| Dynamic/custom templates | `templates` + `template_versions` | `{{variable}}` substitution, versioned, preview, test-send |
| Bulk sending | `campaigns` + `mail` queue | Segment-targeted, chunked via per-recipient queue jobs (ADR-0005) |
| Campaign scheduling | `campaigns.scheduledAt` | Send-now or scheduled |
| Event webhook verification | `webhooks` module | ECDSA signature check, `sg_event_id` dedup |
| Inbound parse webhook | `inbound` module | **Not signature-verified — see gap below** |
| Suppressions / unsubscribes | `suppressions` module | Auto-recorded from event webhook (bounce/complaint/unsubscribe) + manual |
| Bounce/spam/drop tracking | `email_events` | |
| Open/click analytics | `analytics` module | 30-day overview + timeseries |
| Per-tenant usage tracking | `usage` module | Message/event counts this month |
| Error logging | `SendGridError` (typed) | |
| Retry strategy | `packages/sendgrid` + `mail` queue | 429 → jittered backoff, centralized |
| Queue processing | BullMQ `mail` queue | |
| Rate-limit handling | `packages/sendgrid` | Per-subuser 429 handling |

## Gaps to close as part of this expansion

1. **Inbound Parse webhook has no signature/authenticity check.** SendGrid's
   Inbound Parse does not sign requests the way the Event Webhook does;
   the standard mitigation is (a) restrict the route at the infra layer to
   SendGrid's published IP ranges, and (b) append a shared-secret query
   param to the configured Inbound Parse URL and reject requests missing
   it. Both are cheap and should land **before** inbound becomes a workflow
   trigger source (Phase 15) — sequenced explicitly in
   `18-implementation-roadmap.md` as a Phase 13 hardening task, not deferred
   indefinitely.
2. **A/B testing architecture** (brief requirement) does not exist yet.
   Scheduled in Phase 13 alongside the other email-hardening work
   (`18-implementation-roadmap.md`). Design: `campaigns` gains `variants jsonb null` (array of `{subject?,
   templateVersionId?, splitPercent}`); send-time logic randomly assigns
   each queued recipient to a variant (stored on the `messages` row as
   `variant_key`); `campaigns/:id/stats` breaks down by `variant_key`;
   "winner" is a manual promote action (auto-promote-by-open-rate is
   explicitly **deferred** — statistically risky to automate without a
   significance check, and out of scope for this phase).
3. **Contact-level email activity surfaced in the unified timeline**
   (`04-database-schema.md` §3) — existing `email_events`/`messages` data is
   sufficient, this is a read-model addition (`GET /api/contacts/:id/timeline`),
   not a SendGrid-side change.

## Environment variables (existing — unchanged, documented fully in `20-env-example.md`)

`SENDGRID_MOCK_MODE`, `SENDGRID_PARENT_API_KEY`,
`SENDGRID_WEBHOOK_VERIFICATION_KEY`, `INBOUND_PARSE_DOMAIN`,
`ENCRYPTION_KEY`. The brief additionally names `SENDGRID_API_KEY`,
`SENDGRID_WEBHOOK_PUBLIC_KEY`, `SENDGRID_INBOUND_PARSE_SECRET`,
`DEFAULT_FROM_EMAIL`, `DEFAULT_FROM_NAME` — these map onto the existing
names as follows, **do not introduce duplicate env vars for the same
concept**:

| Brief's name | Existing/actual name | Note |
|---|---|---|
| `SENDGRID_API_KEY` | `SENDGRID_PARENT_API_KEY` | Existing name is more precise (it's the parent/provisioning key, not a per-send key) — keep it |
| `SENDGRID_WEBHOOK_PUBLIC_KEY` | `SENDGRID_WEBHOOK_VERIFICATION_KEY` | Same concept, keep existing name |
| `SENDGRID_INBOUND_PARSE_SECRET` | **New** — add this exact name for the shared-secret gap fix above | Not yet in `.env.example`; add in the hardening task |
| `DEFAULT_FROM_EMAIL` / `DEFAULT_FROM_NAME` | **Not currently modeled** — sender identity is per-tenant (`senders` table), there is no platform-wide default sender | Add only if a "system" sender (e.g., for platform-level transactional mail like password reset, once that exists) is needed — track in `22-open-questions-and-decisions.md`, don't add speculatively |

## Server-side-only rule (unchanged, restated for this expansion)

No SendGrid key, webhook verification key, or Inbound Parse secret is ever
sent to `apps/web`. `packages/sendgrid` remains the only caller of the
SendGrid API (ADR-0006) — this rule is unaffected by adding Twilio/Stripe
alongside it.
