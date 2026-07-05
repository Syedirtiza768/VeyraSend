# ADR-0004 — Inbound inbox scope: Inbound Parse replies only

Date: 2026-06-30 · Status: Accepted · Supersedes: none

## Context

Brief §5/§6: the "inbox" must be scoped honestly against what SendGrid
provides.

## Decision

The inbox is **reply handling over a SendGrid Inbound Parse domain**, not a
general IMAP/Gmail-style mailbox and not forwarding of arbitrary external mail.

## Consequences

- We receive mail only for addresses on a domain/subdomain whose MX records
  point to SendGrid, via the Inbound Parse webhook.
- The platform maps parsed replies to contacts, threads, and the originating
  campaign/message.
- "Forwarding arbitrary external mail" and "unified inbox across external
  providers" are out of scope and marked `Not feasible via SendGrid` in
  `SUPPORTED.md`.
- Attachments are handled within Inbound Parse payload limits.
- Reply-from-platform sends via Mail Send from the same address the contact
  replied to, preserving threading headers where possible.
