# Phase 14 — Unified Conversations Inbox

Status: **complete** · Gate: see §4 · Depends on: Phase 12, Phase 13 (complete)

## 1. Goal

One conversation thread per contact aggregating email, SMS, and voice; channel filtering; assignments, read state, internal notes; migrate legacy inbound data.

## 2. Scope

In scope: `conversations` + `conversation_notes` tables, `messages.conversation_id`/`call_id`, `conversations` API module, channel adapters wired to inbound/SMS/voice, `/conversations` UI, `/inbox` redirect, data migration from `inbound_threads`/`inbound_messages`, contact timeline includes messages.

Out of scope: workflow triggers (`sms.received`), SSE/WebSocket push, per-user read cursors, contact sidebar panel (reads existing contact APIs client-side later), superseding ADR-0004 (tracked separately).

## 3. Acceptance gate

1. One contact's email reply and SMS appear in a single conversation.
2. Channel filter (`?channel=email`) returns matching threads.
3. Internal note does not create a `Message` row.
4. Legacy inbound data migrated and queryable.
5. `/inbox` redirects to `/conversations`.
6. Tests pass (`conversations-phase.spec.ts`).

## 4. Deliverables

| Area | Artifact |
|---|---|
| DB | `1700000014000-ConversationsPhase.ts`, `1700000014001-BackfillConversationRolePermissions.ts` |
| API | `apps/api/src/modules/conversations/` |
| Adapters | `inbound.service`, `sms.service`, `voice.service` |
| UI | `apps/web/app/(authed)/conversations/page.tsx`, `conversations-manager.tsx` |
| Tests | `apps/api/test/conversations-phase.spec.ts` |
