# 08 — Twilio Integration

## Status: net new (Phase 13). Mirrors the `packages/sendgrid` pattern
exactly — same shape, same rigor, same review-blocking rule
("no code outside `packages/twilio` calls the Twilio API").

## Integration model: parent account + Subaccounts (mirrors ADR-0001)

Same decision as SendGrid, for the same reasons: one platform-owned Twilio
account provisions a **Twilio Subaccount** per tenant, giving per-tenant
isolation of phone numbers, usage, and billing without per-tenant Twilio
signups. Consequences, mirroring ADR-0001 exactly:

- Platform holds one parent Account SID + Auth Token (secret store).
- `packages/twilio` supports parent-level operations (create subaccount,
  provision number under a subaccount) and subaccount-scoped operations
  (send SMS, place call, configure webhooks) using the subaccount's own SID
  + auth token (fetched decrypted from `tenant_twilio_settings`).
- Mock mode (`TWILIO_MOCK_MODE=true`) returns deterministic fakes,
  identical philosophy to `SENDGRID_MOCK_MODE`, so the whole SMS/voice flow
  is demoable without a real Twilio account — required for local dev and
  CI, not optional polish.
- Rate limits are per-subaccount; centralize 429/rate-limit handling in the
  wrapper exactly like `packages/sendgrid` does today.

**Ratified as ADR-0007** (`docs/decisions/0007-twilio-integration-model.md`,
Accepted) — including the per-subaccount number-purchase mechanics that
differ from SendGrid Subusers.

## `packages/twilio` surface

```typescript
export class TwilioClient {
  // Subaccount provisioning
  createSubaccount(args: { friendlyName }): SubaccountResult
  // Number provisioning
  searchAvailableNumbers(args: { subaccountSid, areaCode? }): AvailableNumber[]
  purchaseNumber(args: { subaccountSid, e164Number }): PhoneNumberResult
  releaseNumber(args: { subaccountSid, numberSid }): void
  configureNumberWebhooks(args: { subaccountSid, numberSid, smsUrl, voiceUrl, statusCallbackUrl }): void

  // Messaging
  sendSms(req: SmsSendRequest): SmsSendResult   // supports mediaUrl[] for MMS

  // Voice
  placeCall(req: CallRequest): CallResult
  generateTwiml(instructions: TwimlInstruction[]): string   // <Dial>, <Record>, <Say>, <Gather> etc.

  // Webhook validation
  verifyWebhookSignature(url: string, params: Record<string,string>, signatureHeader: string): boolean

  get mockMode(): boolean
}
export function getTwilioClient(): TwilioClient
```

## SMS send/receive

- **Outbound**: `sms` module enqueues a `sms` BullMQ job (same idempotency-
  key + bounded-retry pattern as `mail`); worker calls
  `TwilioClient.sendSms`; updates `messages.status` via the returned
  `MessageSid`.
- **Inbound**: `POST /api/webhooks/twilio/sms` — Twilio posts
  form-encoded params; `verifyWebhookSignature` checked against
  `X-Twilio-Signature` (**mandatory**, unlike the current gap on SendGrid's
  Inbound Parse — do not repeat that gap here); resolves/creates `Contact`
  by phone number, creates/updates `Conversation`, inserts a `messages` row
  with `channel='sms', direction='inbound'`.

## MMS

Same path as SMS; `mediaUrl[]` on send, `NumMedia`/`MediaUrl{N}` params on
inbound webhook; stored as `messages.attachments` (reuse the existing
attachments jsonb shape from `inbound_messages` rather than inventing a new
shape).

## Voice: calls, forwarding, recording, voicemail, IVR basics

- **Outbound**: `POST /api/calls` → `voice-outbound` queue → 
  `TwilioClient.placeCall` with a TwiML `Url` pointing back at
  `/api/webhooks/twilio/voice/connect` (dynamically generates TwiML based
  on call state).
- **Inbound routing**: Twilio posts to `/api/webhooks/twilio/voice` on an
  incoming call; handler looks up the number's configured forwarding rule
  (`phone_numbers` config) and returns TwiML `<Dial>` to the assigned
  user's forwarding number, or `<Record>` for voicemail if no answer/no
  forwarding configured.
- **Call recording**: enabled via `<Record>` verb or `Record=true` on
  `<Dial>`; recording-complete status callback creates a `call_recordings`
  row. Consent handling (announce recording, jurisdiction rules) is a
  compliance concern, not a technical one — see `16-security-compliance.md`.
- **Voicemail**: no-answer path records to `voicemail_messages`; Twilio's
  built-in transcription (or a follow-up transcription call) fills
  `transcription`.
- **Missed-call text-back**: `call.missed` status callback (no-answer,
  busy, failed with no recording) is a registered workflow trigger
  (`09-workflow-engine.md`) whose default template action sends an
  automatic SMS — this is a **workflow**, not hardcoded logic in the voice
  module, so tenants can customize or disable it.
- **IVR/`<Gather>` depth**: out of scope beyond the missed-call/voicemail/
  forward basics above — full IVR menu building is enterprise-PBX territory
  and explicitly not planned (`01-product-vision.md`).

## Compliance controls (detailed further in `16-security-compliance.md`)

- **Opt-in required before first SMS send** to any contact — `contacts`
  gains `smsOptInStatus` (`unknown`|`opted_in`|`opted_out`), checked at
  send time; sending to `opted_out` is a hard block (`422
  sms_opt_out_blocked`), not a warning.
- **STOP/START keyword handling**: Twilio's carrier-level STOP handling is
  the first line of defense; the platform additionally listens for
  STOP/START/UNSUBSCRIBE/CANCEL/END/QUIT (case-insensitive) on inbound SMS
  and syncs `contacts.smsOptInStatus` + a `suppressions`-equivalent record
  so workflows/campaigns respect it even if Twilio-side carrier filtering
  ever lags.
- **DNC/TCPA-aware controls**: platform does not subscribe to a national
  DNC registry directly (that's a paid third-party data feed, out of scope
  unless explicitly requested); instead, the platform enforces
  opt-in-before-send + honors opt-out + logs consent timestamps, which
  covers the core TCPA obligation for a tenant using this platform
  responsibly. Document this scope limitation honestly in
  `16-security-compliance.md` rather than implying full DNC-registry
  compliance is automated.

## Usage/cost tracking per tenant

Every `twilio_events` row and every `sms`/`voice-outbound` queue completion
writes into `usage_records` (same table as SendGrid usage, `provider='twilio'`,
`metric='sms_sent'|'call_minutes'`) — see `04-database-schema.md` §
"usage & billing" and `18-implementation-roadmap.md` Phase 17/18.

## Environment variables

| Var | Purpose | Secret |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Parent account SID | No (SID is not secret, but treat consistently) |
| `TWILIO_AUTH_TOKEN` | Parent auth token | Yes |
| `TWILIO_API_KEY` / `TWILIO_API_SECRET` | Scoped API key/secret, if used instead of the raw auth token for parent-level calls (recommended over the raw token per Twilio's own guidance) | Yes |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional Messaging Service for sender pool/compliance features (e.g., automatic STOP handling) | No |
| `TWILIO_VOICE_APP_SID` | TwiML App SID for voice webhook routing | No |
| `TWILIO_WEBHOOK_AUTH_TOKEN` | Used to validate `X-Twilio-Signature` — in practice this is the same as `TWILIO_AUTH_TOKEN` (Twilio signs with the account/subaccount auth token); keep as a distinct config name only if subaccount-level tokens are used for validation instead of the parent token — confirm during Phase 13 spec and update `20-env-example.md` accordingly |
| `TWILIO_MOCK_MODE` | Mirrors `SENDGRID_MOCK_MODE` | No |

Full `.env.example` additions listed in `20-env-example.md`.

## Server-side-only rule

Identical to SendGrid: no Twilio credential of any kind is ever sent to
`apps/web`. `packages/twilio` is the only caller.
