# Phase 12 — CRM Core

Status: **complete** · Gate: see §4 · Depends on: Phases 0–11 (complete)

## 1. Goal

Add the CRM foundation — companies, pipelines/deals, tasks, notes, tags,
custom fields, and contact timelines — so every later module (conversations,
workflows, calendar, forms) composes off `Contact`.

## 2. Scope

In scope:

- Entities + migrations: `companies`, `pipelines`, `pipeline_stages`, `deals`,
  `tasks`, `notes`, `tags`, `contact_tags`, `custom_fields`, `custom_field_values`;
  extend `contacts` with `company_id`, `owner_user_id`, `lead_source`,
  `lifecycle_stage`, `phone`.
- Backend modules: `companies`, `pipelines`, `deals`, `tasks`, `notes`, `tags`,
  `custom-fields`; extend `contacts` with get-by-id, tags, timeline, export,
  duplicates, extended CSV import.
- RBAC: new permission strings for all CRM resources; backfill system roles.
- Frontend: `/companies`, `/companies/[id]`, `/contacts/[id]`, `/pipelines`,
  `/deals/[id]`, `/tasks`; TanStack Query for new screens; Sales nav group.
- Tests: tenant isolation, RBAC, polymorphic entity validation, pipeline stage
  atomic replace, deal move audit.

Out of scope: Twilio, unified conversations, workflow engine, calendar, forms,
agency layer (Phases 13–18).

## 3. Deliverables

- `docs/phases/phase-12-spec.md` (this file).
- `packages/db` entities + migrations `1700000012000-CrmCore`,
  `1700000012001-BackfillCrmRolePermissions`.
- `apps/api` modules listed above.
- `apps/web` CRM screens + QueryProvider.
- `apps/api/test/crm-core.spec.ts`.

## 4. Acceptance gate

1. User creates a company, links contacts, builds a pipeline with stages.
2. User creates a deal and moves it across stages on the Kanban board.
3. User adds a task and note; tags a contact.
4. Contact timeline shows company/deal/task/note/audit activity.
5. Tenant isolation and RBAC enforced on every new route (tests prove it).
6. CSV import accepts `company` and `tags` columns.
7. `synchronize` still false; migrations only; typecheck + test pass.

## 5. Permissions (new)

| Permission | owner | admin | member |
|---|---|---|---|
| `companies:*` | ✓ | ✓ | read |
| `pipelines:*` | ✓ | ✓ | read |
| `deals:*` | ✓ | ✓ | read |
| `tasks:*` | ✓ | ✓ | read |
| `notes:*` | ✓ | ✓ | read |
| `tags:*` | ✓ | ✓ | read |
