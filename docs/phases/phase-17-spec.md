# Phase 17 — Payments, Invoices, Proposals

Status: **complete** · Gate: see §4 · Depends on Phases 13, 15 (complete)

## 1. Goal

Ship Stripe-backed invoices with email payment links, standalone text-to-pay payment links, webhook-verified payment confirmation, `invoice.paid` workflow trigger, and Stripe metrics in usage rollup.

## 2. Scope

In scope: `packages/stripe`; tables `invoices`, `payment_links`, `tenant_stripe_settings`; `billing` module; `POST /api/webhooks/stripe` with signature verification; permissions `billing:read`/`billing:write`; `/invoices` and `/payment-links` UI.

Out of scope: Stripe Connect agency rebilling (Phase 18); proposals/estimates builder UI; client-side payment status updates.

## 3. Acceptance gate

1. Invoice created (draft), sent with payment link email, paid only after Stripe webhook.
2. `invoice.paid` fires a published workflow.
3. Webhook rejects invalid signature.
4. Tests pass (`phase-17.spec.ts`).

## 4. Deliverables

| Area | Artifact |
|---|---|
| Package | `packages/stripe` — mock mode + Payment Links API |
| DB | `1700000017000-Phase17Billing.ts`, `1700000017001-BackfillPhase17Permissions.ts` |
| API | `billing/` module, `stripe-webhooks.service.ts` |
| Trigger | `invoice.paid` in workflow registry |
| UI | `/invoices`, `/payment-links` |
| Tests | `apps/api/test/phase-17.spec.ts` |
