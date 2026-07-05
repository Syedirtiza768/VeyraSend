# 01 — Product Vision

## Mission

VeyraSend becomes an all-in-one CRM, marketing automation, communications, and
agency operating system — built on the same disciplined architecture as its
existing SendGrid email platform, extended with Twilio-powered SMS/voice and a
generic CRM/workflow/booking/funnel core. A business (or an agency managing
many client businesses) runs contacts, pipelines, conversations, campaigns,
automations, calendars, funnels, reputation, and billing from one product,
without logging into SendGrid, Twilio, or Stripe directly.

This is explicitly modeled on GoHighLevel's product surface, but is **not** a
clone of GoHighLevel's implementation, UI, or internal architecture — it is
built with VeyraSend's own module boundaries, data model, and design system
(EnXi).

## Who this is for

| Persona | What they need from VeyraSend |
|---|---|
| **Agency owner** | Run many client sub-accounts from one login, white-label the product for clients, rebill SMS/email/voice usage, see cross-client reporting |
| **Agency account manager** | Switch between client sub-accounts, manage campaigns/automations/conversations per client |
| **SMB owner (direct tenant)** | One workspace: capture leads, follow up automatically, take payments, manage a team |
| **SMB front-desk/sales rep** | Live in the Conversations Inbox and Pipeline board daily; needs speed, not configuration power |
| **Tenant admin/ops** | Configure senders/domains/numbers, workflows, forms, billing — the power-user persona |

## Product principles (non-negotiable, extending the existing brief's rules)

1. **Every existing rule from `docs/REQUIREMENTS.md` still applies** to new
   modules: spec before code, hard phase gates, ADRs for forks, no secrets in
   code/logs, tenant-scope everything, migrations only, defensive external
   calls through one integration layer per provider, honesty in
   `SUPPORTED.md`, test the risky parts.
2. **One integration package per provider.** `packages/sendgrid` already
   exists and is the only SendGrid caller. A new `packages/twilio` is the
   only Twilio caller, mirroring the same shape (client wrapper, mock mode,
   webhook signature verification, typed errors, backoff).
3. **Contact is the spine.** Every new module (conversations, deals, calls,
   appointments, workflows, forms, reputation) hangs off `Contact`. No module
   invents its own parallel "person" concept.
4. **Channels are pluggable, the inbox is not.** Email, SMS, voice, and future
   WhatsApp/chat/social DMs are channel adapters into one `Conversation`/
   `Message` model — never channel-specific inbox UIs bolted on separately.
5. **Workflows are the automation surface, automations are a subset.** The
   existing `Automation` entity (contact.created trigger, send/wait/branch)
   is superseded by the general-purpose workflow engine (`09-workflow-engine.md`);
   existing automations are migrated, not left as a second parallel system.
6. **Agency/tenant is a hierarchy, not a bolt-on.** Sub-accounts, white-label,
   and rebilling are modeled from the start of the SaaS layer work (Phase 8
   of the roadmap), not retrofitted after tenants already assume "tenant =
   one business."
7. **Honesty over feature-checklist theater.** If a GHL feature can't be
   built honestly on Twilio/SendGrid/Stripe within a phase, it's marked
   `Deferred` or `Not planned` in `02-feature-matrix-ghl-style.md` — the same
   discipline `SUPPORTED.md` already applies to SendGrid.

## What VeyraSend is not

- Not a general-purpose IMAP/Gmail-style mailbox (still true — `10-conversations-inbox.md`
  explains how the inbox is reframed now that SMS/voice join email).
- Not a page-builder/CMS competitor — the funnel/landing-page module
  (`13-forms-funnels-pages.md`) is deliberately scoped to lead-capture pages,
  not a general website builder.
- Not a phone-system replacement for enterprise call centers — voice is
  scoped to business calling, tracking, and voicemail, not PBX/IVR depth.
- Not multi-database-per-tenant — tenancy stays single-DB row-scoped
  (ADR-0002), now extended to a two-level hierarchy (agency → sub-account).

## Naming

Internally, "tenant" continues to mean a single business/workspace. "Agency"
is a tenant flagged with `type = agency` that owns other tenants
(`type = sub_account`) — see `15-saas-multitenancy-rbac.md`. This avoids
introducing a second parallel entity for "agency."

## Success definition

A logged-in agency admin creates a sub-account, connects that sub-account's
SendGrid sender/domain and Twilio number, imports contacts, builds a pipeline,
receives and replies to a lead across email and SMS in one inbox, books an
appointment from a link, runs a workflow that follows up automatically,
requests a review after the appointment, invoices the client, and sees
usage/cost rolled up at the agency level — all tenant-isolated, RBAC-enforced,
queue-backed, migration-driven, and documented with the same rigor as the
existing email platform.
