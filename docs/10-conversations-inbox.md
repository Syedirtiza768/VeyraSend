# 10 — Conversations Inbox

## Relationship to the existing `/inbox` (Inbound Parse reply threads)

The existing inbox (ADR-0004: "Inbound Parse replies only, not a general
inbox") is **superseded, not deleted outright**, by this unified inbox. The
existing `InboundThread`/`InboundMessage` tables and their data are migrated
into `conversations`/`messages` (extended, per `04-database-schema.md` §3)
as part of Phase 14. ADR-0004 itself needs a superseding ADR — its
underlying technical constraint (SendGrid Inbound Parse ≠ a general
IMAP mailbox) is still true and still governs the **email channel
specifically**, but the product-level claim "not a general inbox" no longer
holds once SMS/voice are first-class channels in the same UI. Write the new
ADR explicitly rather than let the two silently coexist (tracked in
`22-open-questions-and-decisions.md`).

## What stays true from ADR-0004 (carried forward, now scoped to the email channel only)

- Email is still received only via the Inbound Parse domain — no IMAP/OAuth
  mailbox connection to a tenant's real email provider. "Unified inbox
  across external email providers" (Gmail/Outlook connectors) remains
  **Not feasible via SendGrid** / **Not planned** for this platform.
- "Forwarding arbitrary external mail" is still out of scope.

## What's new

SMS and voice are first-class channels with their own inbound paths
(Twilio webhooks, `08-twilio-integration.md`), and all channels resolve
into one `Conversation` per contact rather than separate per-channel inbox
screens.

## Data model (full column detail in `04-database-schema.md` §3)

`Conversation` = one row per contact (not per channel — a contact has at
most one open conversation aggregating all channels, so replying by SMS to
an email thread is still "the same conversation" from the user's
perspective). `Message` = one row per individual email/SMS/call-event,
tagged with `channel` and `direction`, optionally linked to a
`conversation_id`. This is a deliberate **1 conversation : many messages
across channels** model, not 1 conversation per channel per contact —
because the product goal ("central inbox... conversation threads by
contact") explicitly wants channel-crossing threads, not channel silos.

Calls are represented in the inbox as `messages` rows too (`channel='voice'`,
with `call_id` populated) so a call shows up inline in the same
chronological thread as emails/texts, not as a separate widget the user has
to cross-reference.

## Channel adapter pattern

Each channel (email, SMS, voice, future WhatsApp/chat/social) implements
the same two-directional contract:

```
Inbound:  provider webhook → verify signature → resolve/create Contact
          → resolve/create Conversation → insert Message(channel=X, direction=inbound)
          → touch Conversation.lastMessageAt, unread=true
          → dispatch workflow trigger if applicable (e.g. sms.received)

Outbound: POST /api/conversations/:id/messages { body, channel }
          → resolve tenant's active sender/number for that channel
          → enqueue on the channel's queue (mail/sms/voice-outbound)
          → insert Message(channel=X, direction=outbound, status=queued)
          → webhook status callback updates Message.status
```

Adding a new channel later (WhatsApp, chat widget) means implementing this
contract once — no change to `Conversation`, no change to the inbox UI's
core rendering (only a new message-bubble style + a new "channel not
configured" empty state), which is why this is worth designing correctly
now even though only email/SMS/voice ship in this phase's scope.

## UI requirements mapped to components (detail in `06-frontend-information-architecture.md`)

Conversation threads by contact → `conversation-thread.tsx`. Channel
filtering → filter chips in `conversation-list.tsx`. Internal notes →
`POST /api/conversations/:id/notes`, rendered visually distinct (not a
`Message` row — a separate lightweight note type so it's unambiguous it was
never sent to the contact). Assignments → `assigned_user_id`. Read/unread →
per-conversation `unread` boolean (single-reader-cursor model; a
per-user-per-conversation read state is **deferred** — not needed until
multiple agents commonly work the same conversation, track as an open
question if that becomes a complaint). Message status tracking →
`messages.status`, channel-appropriate values (email:
queued/sent/delivered/bounced/failed; SMS: queued/sent/delivered/undelivered/
failed; voice: represented via the linked `calls.status`). Attachments →
MMS media (Twilio) and existing inbound-email attachments; outbound
attachments remain out of scope (per feature matrix). Contact sidebar →
reads existing contact/deal/task data, no new backend. Quick
replies/snippets → **Deferred** per feature matrix, not built this phase.

## Non-real-time note

First implementation polls (TanStack Query refetch interval) rather than
websockets/SSE — stated explicitly in `06-frontend-information-architecture.md`
and here to avoid an implicit assumption of real-time push. If inbox
responsiveness becomes a complaint post-launch, evaluate SSE for the
conversation list as a follow-up, not a Phase 14 requirement.
