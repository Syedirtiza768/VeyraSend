# Phase 13 — Twilio SMS & Phone + Inbound Parse Hardening

Status: **complete** · Gate: see §4 · Depends on: Phase 12 (complete)

## 1. Goal

SMS/MMS send+receive, voice call log + voicemail, STOP/START compliance, Twilio webhooks with signature verification, and harden SendGrid Inbound Parse.

## 2. Scope

In scope: `packages/twilio`, 7 new tables, inbound parse secret, `phone-numbers`/`sms`/`voice` modules, `/phone-numbers` + `/calls` UI, missed-call text-back stopgap.

Out of scope: unified conversations (P14), full workflow engine (P15), email A/B (deferred to separate hardening if not in this PR).

## 3. Acceptance gate

1. Tenant provisions Twilio, buys a number (mock or real), sends/receives SMS.
2. STOP blocks subsequent SMS (`422`).
3. Call logged; missed call triggers text-back stopgap.
4. Inbound Parse rejects requests without valid secret.
5. Twilio webhook rejects tampered signature (`403`).
6. Tests pass.
