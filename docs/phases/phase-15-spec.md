# Phase 15 — Workflow Engine

Status: **complete** · Gate: see §4 · Depends on: Phases 12–14 (complete)

## 1. Goal

Replace the prototype `automations` ticker with an event-driven, queue-based workflow engine: versioned definitions, trigger dispatch from CRM/comms modules, BullMQ step execution, dry-run test mode, and a step-list builder UI.

## 2. Scope

In scope: `workflows`/`workflow_versions`/`workflow_triggers`/`workflow_actions`/`workflow_runs`/`workflow_run_steps` tables; data migration from `automations`; `workflows` API module; `workflow-run` BullMQ queue; trigger wiring (`contact.created`, `tag.added`, `pipeline_stage.changed`, `email.opened`/`email.clicked`, `sms.received`, `call.missed`, `manual`); action executors (`send_email`, `delay`, `condition`, `send_sms`, `add_tag`, `remove_tag`, `create_task`, `stop`); `/workflows` UI; `/api/automations/*` read-only (writes return 410); missed-call text-back migrated from hardcoded `VoiceService` stopgap to `call.missed` trigger.

Out of scope: dropping `automations` tables (follow-up migration); drag-and-drop graph editor; `webhook-dispatch`/`reminder` queues; triggers for appointments/forms/billing (Phase 16+); manual retry-from-step UI.

## 3. Acceptance gate

1. Welcome sequence with `send_email` → `delay` → `condition` branch runs end-to-end on `contact.created`.
2. Dry-run (`POST /api/workflows/:id/test-run`) records step output without creating message ledger rows.
3. Completed steps are not re-executed on BullMQ redelivery (idempotency guard).
4. Published version pins at run creation; in-flight runs unaffected by draft edits.
5. Missed inbound call fires `call.missed` dispatch (replaces Phase 13 hardcoded SMS).
6. Tests pass (`workflows-phase.spec.ts`).

## 4. Deliverables

| Area | Artifact |
|---|---|
| DB | `1700000015000-WorkflowsPhase.ts`, `1700000015001-BackfillWorkflowPermissionsAndMigrateAutomations.ts` |
| API | `apps/api/src/modules/workflows/` (dispatch, engine, queue, CRUD) |
| Triggers | `contacts`, `tags`, `deals`, `webhooks`, `sms`, `voice` modules |
| UI | `apps/web/app/(authed)/workflows/page.tsx`, `workflows-manager.tsx` |
| Tests | `apps/api/test/workflows-phase.spec.ts`; `automations.spec.ts` updated for read-only |
| Permissions | `workflows:read`, `workflows:write`, `workflows:publish` |
