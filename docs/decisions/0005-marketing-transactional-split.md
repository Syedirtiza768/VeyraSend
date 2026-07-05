# ADR-0005 — Marketing / transactional subsystem split

Date: 2026-06-30 · Status: Accepted · Supersedes: none

## Context

Brief §5/§6: SendGrid's Marketing Campaigns subsystem (contacts, lists,
segments) is distinct from Mail Send (transactional + bulk delivery).

## Decision

Treat them as distinct subsystems.

- Contacts, lists, and segments are managed via the **Marketing Campaigns
  APIs**, mirrored locally for query/segment preview.
- Transactional and campaign delivery use the **Mail Send API**.

## Consequences

- `packages/sendgrid` exposes two clear surfaces: `marketing` and `mail`.
- Contact upserts and segment membership are eventually consistent on
  SendGrid's side; the build designs for async reconciliation (Phase 4).
- Bulk campaign delivery is chunked + queued (BullMQ) and issued through Mail
  Send, not Marketing Campaigns single-send.
- Unsubscribe groups (ASM) bridge both subsystems and must be honored on every
  send (Phase 4 + Phase 6).
