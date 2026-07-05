# ADR-0001 — SendGrid integration model: Parent account + Subusers

Date: 2026-06-30 · Status: Accepted · Supersedes: none

## Context

The platform is multi-tenant SaaS on top of the SendGrid Web API. Two viable
integration models exist (brief §5):

- **(A) Parent account + Subusers.** Platform owns one SendGrid account; each
  tenant maps to a SendGrid Subuser with its own reputation, sending identity,
  and event stream.
- **(B) Bring-your-own-key.** Each tenant supplies their own SendGrid API key,
  stored encrypted.

This choice changes key storage, rate-limit handling, webhook routing, and
analytics scoping, and is not cleanly reversible.

## Decision

Adopt **(A) Parent account + Subusers**.

## Consequences

- One parent API key (platform-owned, in secret store) provisions and manages
  Subusers per tenant.
- Per-tenant sending identity, reputation, and event stream are isolated by
  SendGrid.
- `packages/sendgrid` must support parent-key operations (subuser create,
  allocate IP, set event webhook target) and subuser-key operations (mail send,
  suppressions, marketing).
- Webhook routing: the Event Webhook posts to a single platform endpoint; we
  disambiguate tenant via the subuser/event payload. The Inbound Parse webhook
  routes per-parse-domain.
- Central billing at the platform; per-tenant usage metering in Phase 10.
- Requires a SendGrid plan that supports Subusers. Until a real parent key is
  supplied, the integration layer runs in a documented mock mode.
- Rate limits are per-subuser; the wrapper centralizes 429 handling with
  jittered backoff keyed per subuser.
