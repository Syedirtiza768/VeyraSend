# ADR-0007 — Twilio Integration Model

## Status

Accepted · Phase 13

## Context

Phase 13 adds SMS/MMS/voice. Twilio supports subaccounts mirroring SendGrid subusers (ADR-0001).

## Decision

- One platform-owned Twilio parent account provisions a **Subaccount** per tenant.
- Credentials stored in `tenant_twilio_settings` (encrypted auth token, same AES-256-GCM + `ENCRYPTION_KEY` as SendGrid).
- All Twilio API access goes through `packages/twilio` only.
- `TWILIO_MOCK_MODE=true` (default when no parent credentials) returns deterministic fakes for dev/CI.
- Webhook signature verification (`X-Twilio-Signature`) is mandatory before any DB write.

## Consequences

- Phone numbers are purchased per subaccount, not shared pool.
- Usage rolls into `usage_records` with `provider='twilio'`.
