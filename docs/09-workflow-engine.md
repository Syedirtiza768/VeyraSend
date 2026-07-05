# 09 — Workflow Engine

## Relationship to the existing `automations` module

The existing `Automation`/`AutomationEnrollment` system (trigger
`contact.created`, steps send/wait/branch, FSM state active/completed/
exited) is the **prototype** for this engine, not a separate system to keep
running in parallel long-term. Migration plan (also stated in
`03-system-architecture.md` §7):

1. Build `workflows`/`workflow_versions`/`workflow_triggers`/
   `workflow_actions`/`workflow_runs`/`workflow_run_steps` alongside the
   existing tables — no schema removal yet.
2. Write a one-time data migration converting each `Automation.definition`
   into an equivalent `Workflow` + `WorkflowVersion` (trigger
   `contact.created` → `trigger_type='contact.created'`; existing
   send/delay/branch steps → equivalent DSL nodes below).
3. Cut the trigger dispatcher over to the new engine; keep `/api/automations/*`
   read-only (redirect writes to `/api/workflows/*`) for one release cycle.
4. Drop `automations`/`automation_enrollments` tables in a follow-up
   migration once the new engine has run a full production cycle with no
   regressions.

## 1. Design goals

Event-driven, queue-based, idempotent, versioned, observable, safe to test
without side effects — these are requirements, not aspirations, per the
brief. Every design choice below is justified against one of these goals.

## 2. Workflow DSL / data model

A workflow version's `definition` (stored as `jsonb` on `workflow_versions`)
is a directed graph:

```json
{
  "trigger": {
    "type": "pipeline_stage_changed",
    "config": { "pipelineId": "...", "toStageId": "..." }
  },
  "nodes": {
    "start": { "type": "action", "action": "send_email", "config": { "templateId": "..." }, "next": "wait1" },
    "wait1": { "type": "delay", "durationSeconds": 86400, "next": "cond1" },
    "cond1": { "type": "condition", "field": "contact.tags", "op": "contains", "value": "vip", "ifTrue": "sendSms", "ifFalse": "end" },
    "sendSms": { "type": "action", "action": "send_sms", "config": { "body": "..." }, "next": "end" },
    "end": { "type": "end" }
  },
  "entry": "start"
}
```

Rationale for a flat node-map keyed by id (rather than a nested tree):
`workflow_run_steps.node_id` can reference any node directly, delay
resumption doesn't need to re-walk from the root, and branch targets are
just node-id references — this is what makes step-level resumability
(goal: idempotent, queue-based) straightforward.

## 3. Trigger registry

A trigger is a `(type, config schema, payload shape)` tuple registered in
code (`packages/shared` or a dedicated `workflow-triggers` registry file),
**not** dynamically defined by tenants — tenants configure `config` (which
tag, which stage), not new trigger types.

**Do not reuse the existing `AutomationTriggerType`/`AutomationActionType`
enums from `packages/shared`** — they are dead vocabulary the current
automations module never imports, and their values don't even match the
runtime literals it actually validates (`contact.created` is absent from
the trigger enum; the module's `delay` step isn't in the action enum,
which has `wait` instead — verified, see `00-current-state-audit.md` §8).
Define the workflow registry's vocabulary fresh (zod-validated), and
delete those two stale enums in the same cleanup migration/PR that drops
the old `automations` tables (§ migration plan above), so the dead names
can't be mistaken for supported behavior again. Registered triggers (Phase 15
scope, per `02-feature-matrix-ghl-style.md`):

| Trigger type | Payload | Fired from |
|---|---|---|
| `contact.created` | `{ contactId }` | `contacts` module on insert |
| `tag.added` | `{ contactId, tagId }` | `tags` module |
| `pipeline_stage.changed` | `{ dealId, fromStageId, toStageId }` | `deals` module `/move` |
| `email.opened` / `email.clicked` | `{ contactId, messageId }` | `webhooks` (SendGrid event ingest) |
| `sms.received` | `{ contactId, messageId }` | Twilio SMS inbound webhook |
| `call.missed` | `{ contactId, callId }` | Twilio voice status callback |
| `appointment.booked` | `{ contactId, appointmentId }` | `appointments` module |
| `invoice.paid` | `{ contactId, invoiceId }` | Stripe webhook via `billing` module |
| `form.submitted` | `{ contactId, formId, submissionId }` | `forms` module |
| `manual` | `{ contactId }` | User-initiated "run this workflow on this contact" action |
| `date_based` | `{ contactId }` | Scheduled ticker (e.g. "3 days before `appointment.startsAt`") — implemented as a repeatable BullMQ job that scans for matching contacts, not a per-contact cron |

## How to add a new trigger

1. Add the type + payload shape to the trigger registry.
2. Emit it from the owning module via a shared `WorkflowDispatchService.dispatch(tenantId, triggerType, payload)` call — the owning module does not know or care which workflows are listening.
3. `WorkflowDispatchService` queries `workflow_triggers` for `(tenant_id, trigger_type)` matches among **published** workflows, filters by `trigger_config` (e.g., matching tag id), and enqueues one `workflow-run` job per match.
4. No changes needed to the run engine itself — it's trigger-agnostic once a run is created.

## 4. Action registry

| Action | Config | Side effect |
|---|---|---|
| `send_email` | `templateId, variables?` | Enqueues on `mail` queue |
| `send_sms` | `body` (template-var capable) | Enqueues on `sms` queue |
| `create_task` | `title, dueInSeconds?, assigneeUserId?` | Insert into `tasks` |
| `add_tag` / `remove_tag` | `tagId` | `contact_tags` insert/delete |
| `update_field` | `field, value` | Update `contacts` or `custom_field_values` |
| `move_pipeline_stage` | `stageId` | Calls the same service method as `/api/deals/:id/move` (reused, not duplicated) |
| `assign_user` | `userId` | Update `deals.ownerUserId` or `conversations.assignedUserId` per context |
| `wait` (delay node, not technically an "action" but modeled as one node type) | `durationSeconds` or `untilField` | Schedules resumption via BullMQ `delay` |
| `condition` (if/else node) | `field, op, value, ifTrue, ifFalse` | Pure branch, no external side effect |
| `webhook` | `url, method, bodyTemplate` | Outbound HTTP call via `webhook-dispatch` queue |
| `notify` | `message, userId|role` | Internal notification (in-app, not sent to contact) |
| `stop` | — | Terminates the run early |

## How to add a new action

1. Add the action type + config schema to the action registry (zod schema in `packages/shared`).
2. Implement an executor function `(tenantId, contactId, config, runContext) => Promise<StepResult>` in the `workflows` module's executor map.
3. No changes needed to the graph-walking engine — it looks up the executor by `action` string and calls it generically.

## 5. Execution lifecycle

```
trigger fires → WorkflowDispatchService creates workflow_runs row (status=running)
             → enqueues workflow-run job for entry node
worker picks up job:
  1. Load workflow_run + workflow_versions.definition (cached per version — immutable, safe to cache)
  2. Load/create workflow_run_steps row for this node (status=running, attempt+=1)
  3. Execute node:
     - action node → call executor → on success: status=completed, enqueue next node's job
                                    → on retryable failure: throw (BullMQ retries per queue config)
                                    → on permanent failure: status=failed, workflow_runs.status=failed, stop
     - delay node → set run_at = now() + duration, status=pending, enqueue job with BullMQ `delay` option
     - condition node → evaluate synchronously, enqueue next node's job immediately (no queue round-trip needed, but still logged as a completed step for observability)
     - end node → workflow_runs.status=completed
```

Idempotency: each `workflow-run` job's BullMQ job id is
`${runId}:${nodeId}:${attempt}` scoped so a redelivered job doesn't
double-execute a completed step (existing-step-status check at the top of
the worker, mirroring the existing `mail` worker's "skip if already sent"
idempotency check).

## 6. Error handling & dead-letter

Per-queue bounded retries (`workflow-run`: 5 attempts, see
`03-system-architecture.md` §4). On final failure: `workflow_run_steps.status
='failed'`, `error` populated, `workflow_runs.status='failed'` — the run
does **not** silently vanish; it's queryable via
`GET /api/workflows/:id/runs?status=failed` and surfaced in the workflow
detail UI (`06-frontend-information-architecture.md`). No automatic
dead-letter requeue — a failed run requires either a manual "retry from
step" action (Phase 15 stretch, not MVP-blocking) or is simply visible as a
failure to investigate.

## 7. Safe testing mode

`POST /api/workflows/:id/test-run` executes the **draft** definition
against one supplied `contactId` with every action executor running in a
"dry" variant: `send_email`/`send_sms`/`webhook` executors check a
`dryRun` flag on `runContext` and, if set, log what *would* have been sent
(recorded on the `workflow_run_steps.error`-adjacent `jsonb` detail field,
or a dedicated `dry_run_output` column) without calling
`packages/sendgrid`/`packages/twilio`/outbound HTTP at all. This reuses the
exact executor functions (not a parallel simulated implementation) so a
test-run is a true preview of production behavior, with one flag branch,
not a second code path.

## 8. Versioning & draft/published

`workflows.status` (`draft`|`published`|`paused`|`archived`) and
`workflow_versions` (immutable per version) give: editing a published
workflow creates a new draft version without affecting currently-running
`workflow_runs` (which pin `workflow_version_id` at run-creation time — a
change mid-run never retroactively alters in-flight logic). Publishing
promotes the draft version to `workflows.current_version_id` and updates
`workflow_triggers` to point at the new version atomically.

## 9. Observability

Every `workflow_run_steps` row is queryable; the correlation-id logging
convention (`03-system-architecture.md` §9) adds `workflowRunId` to every
log line emitted during execution, so a support engineer can `grep` one run
end-to-end across the dispatch → queue → executor → provider-call chain.

## 10. UI approach (phased, ties to `06-frontend-information-architecture.md`)

Ship the workflow builder UI as a **structured step-list editor** first
(trigger picker + ordered step list with inline config, visually similar to
the existing automations UI) rather than a full drag-and-drop node-graph
editor on day one — the DSL supports branching from the start (so the data
model never needs a breaking change), but the graph-editor UI is
significantly more frontend effort and can follow once the step-list
version proves the underlying engine. This sequencing is deliberate: don't
block Phase 15's backend value on a large frontend investment.
