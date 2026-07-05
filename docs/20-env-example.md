# 20 — Environment Variables Reference

This documents the target `.env.example` for the full expanded platform.
Per this task's scope (documentation only), the actual `.env.example` file
is **not** modified here — the additions below are specified for
implementation to apply at the start of Phase 13 (Twilio) and Phase 17
(Stripe) respectively, alongside the immediate fix to `docker-compose.yml`
called out in `00-current-state-audit.md` §9 and `16-security-compliance.md`.

## Existing (unchanged — already in `.env.example`)

```bash
NODE_ENV=development
API_PORT=4000
WEB_PORT=3040
DATABASE_URL=postgres://veyrasend:veyrasend@localhost:5435/veyrasend
REDIS_URL=redis://localhost:6381
SESSION_SECRET=replace-with-a-long-random-hex-string

# SendGrid (ADR-0001: parent account + subusers)
SENDGRID_MOCK_MODE=true
SENDGRID_PARENT_API_KEY=
SENDGRID_WEBHOOK_VERIFICATION_KEY=
INBOUND_PARSE_DOMAIN=
ENCRYPTION_KEY=
```

## New — add at start of Phase 13 (hardening + Twilio)

```bash
# ---- Inbound Parse hardening (fixes the unsigned-webhook gap, see
# 16-security-compliance.md) ----
# Shared secret appended as a query param to the Inbound Parse URL
# registered with SendGrid; the webhook handler rejects requests missing
# or mismatching it.
SENDGRID_INBOUND_PARSE_SECRET=

# Optional: comma-separated CIDR allowlist for SendGrid's published
# Inbound Parse source ranges, enforced at the reverse-proxy layer in
# production (see 17-deployment-devops.md). Not required in local dev.
SENDGRID_INBOUND_PARSE_IP_ALLOWLIST=

# ---- Twilio (mirrors SendGrid's parent-account + subaccount model,
# see 08-twilio-integration.md and its pending ADR) ----
TWILIO_MOCK_MODE=true
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY=
TWILIO_API_SECRET=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_VOICE_APP_SID=
TWILIO_WEBHOOK_AUTH_TOKEN=

# ---- CORS (Phase 13+ deployment hardening, see 17-deployment-devops.md) ----
# Comma-separated. Defaults to the existing hardcoded localhost origins
# when unset, for backward-compatible local dev.
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3040
```

## New — add at start of Phase 17 (Payments)

```bash
# ---- Stripe (see 22-open-questions-and-decisions.md for the
# Connect-vs-platform-account decision this depends on) ----
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SIGNING_SECRET=
# Only if Stripe Connect is chosen for agency rebilling:
STRIPE_CONNECT_CLIENT_ID=
```

## Explicitly not added (see reconciliation in `07-sendgrid-integration.md`)

`SENDGRID_API_KEY`, `SENDGRID_WEBHOOK_PUBLIC_KEY`, `DEFAULT_FROM_EMAIL`,
`DEFAULT_FROM_NAME` — the brief names these, but they either duplicate an
existing, more precisely-named var (`SENDGRID_PARENT_API_KEY`,
`SENDGRID_WEBHOOK_VERIFICATION_KEY`) or don't correspond to a real concept
in the current per-tenant-sender design (there is no platform-wide default
sender identity today). Do not add duplicate env vars for the same
concept under a different name.

## Rules (unchanged, apply to every var above)

- Every required var causes fail-fast boot failure if missing, per the
  existing `packages/config` zod-validated loader pattern — extend that
  same schema, don't add a second config-loading mechanism for the new
  providers.
- Every var here documented is safe to name in logs; the **values** are
  never logged (existing `redactedConfig()` pattern extends to the new
  Twilio/Stripe fields the same way it already redacts SendGrid fields).
- `.env` is never committed (existing `.gitignore` rule) — and per
  `00-current-state-audit.md` §9, no secret value is ever hardcoded into
  `docker-compose.yml` or any other committed file, full stop.
