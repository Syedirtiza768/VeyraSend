# API Reference (Live)

> Base URL: `http://localhost:4000` (dev) · Global prefix: `/api` · Last verified: **2026-07-05**

## Conventions

- **Auth:** Session cookie (browser). All routes require auth unless `@Public()`.
- **CSRF:** Mutating requests need `x-csrf-token` header matching `csrf` cookie. Skipped for webhooks.
- **Permissions:** `@Permissions('resource:action')` — user must hold at least one listed permission.
- **Tenant:** Resolved from session only — never from request body/params.
- **Responses:** `{ data: T }` on success; `{ error: { code, message } }` on failure.
- **No versioning:** No `/api/v1` prefix exists.

---

## Health (no `/api` prefix)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | DB + Redis reachability |

---

## Auth

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/auth/csrf` | Public | — | Get CSRF token |
| POST | `/api/auth/login` | Public | — | Body: `{ email, password }` → session + csrfToken |
| POST | `/api/auth/logout` | Session | — | Destroy session |
| GET | `/api/auth/me` | Session | — | `{ user, tenant, role, permissions }` |

---

## Tenants

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| POST | `/api/install` | Public | — | Bootstrap first tenant + owner (one-time) |
| GET | `/api/tenants/current` | Session | `tenants:read` | Current tenant info |

---

## Users

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/users` | Session | `users:read` | List tenant users |
| GET | `/api/users/roles` | Session | `users:read` | List roles |
| POST | `/api/users` | Session | `users:write` | Create user + membership |
| PATCH | `/api/users/:id` | Session | `users:write` | Update user role/status |

---

## Audit

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/audit` | Session | `audit:read` | Query: `limit?` (default 100) |

---

## SendGrid

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/sendgrid/status` | Session | `sendgrid:provision` | Provisioning status |
| POST | `/api/sendgrid/provision` | Session | `sendgrid:provision` | Create subuser + store encrypted key |

---

## Senders

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/senders` | Session | `senders:read` | List senders |
| POST | `/api/senders` | Session | `senders:write` | Create sender |
| DELETE | `/api/senders/:id` | Session | `senders:write` | Delete sender |
| POST | `/api/senders/:id/resend-verification` | Session | `senders:write` | Resend verification email |

---

## Domains

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/domains` | Session | `domains:read` | List domains |
| POST | `/api/domains` | Session | `domains:write` | Add domain |
| GET | `/api/domains/:id/dns` | Session | `domains:read` | DNS records (DKIM/SPF) |
| POST | `/api/domains/:id/verify` | Session | `domains:write` | Trigger verification |
| DELETE | `/api/domains/:id` | Session | `domains:write` | Delete domain |

---

## Messages

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/messages` | Session | `messages:read` | List messages |
| GET | `/api/messages/:id` | Session | `messages:read` | Get message |
| POST | `/api/messages/send` | Session | `messages:write` | Enqueue transactional send |

**Send body (representative):** `{ fromEmail, fromName?, toEmail, subject, html?, text?, templateId?, dynamicTemplateData?, idempotencyKey? }`

---

## Events

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/events` | Session | `events:read` | Raw email event stream |

---

## Webhooks (provider-facing)

| Method | Path | Auth | CSRF | Description |
|---|---|---|---|---|
| POST | `/api/webhooks/events` | Public (ECDSA sig) | Skip | SendGrid event webhook |
| POST | `/api/webhooks/inbound` | Public (optional `?secret=`) | Skip | SendGrid Inbound Parse — rejects when `SENDGRID_INBOUND_PARSE_SECRET` set and secret mismatch |
| POST | `/api/webhooks/twilio/sms` | Public (`X-Twilio-Signature`) | Skip | Inbound SMS |
| POST | `/api/webhooks/twilio/voice` | Public (`X-Twilio-Signature`) | Skip | Inbound voice → TwiML XML response |
| POST | `/api/webhooks/twilio/voice/status` | Public (`X-Twilio-Signature`) | Skip | Call status callbacks |

---

## Contacts

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/contacts` | Session | `contacts:read` | List contacts |
| GET | `/api/contacts/duplicates` | Session | `contacts:read` | Phone duplicate report |
| GET | `/api/contacts/:id` | Session | `contacts:read` | Get one |
| GET | `/api/contacts/:id/timeline` | Session | `contacts:read` | Aggregated timeline |
| GET | `/api/contacts/:id/tags` | Session | `contacts:read` | Contact's tags |
| POST | `/api/contacts` | Session | `contacts:write` | Create contact |
| POST | `/api/contacts/import` | Session | `contacts:write` | CSV import (body `{ csv }`) |
| POST | `/api/contacts/export` | Session | `contacts:read` | Export CSV |
| POST | `/api/contacts/:id/tags` | Session | `contacts:write` | Attach tags `{ tagIds[] }` |
| DELETE | `/api/contacts/:id/tags/:tagId` | Session | `contacts:write` | Detach tag |
| DELETE | `/api/contacts/:id` | Session | `contacts:delete` | Soft delete |

---

## Lists

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/lists` | Session | `lists:read` | List lists |
| POST | `/api/lists` | Session | `lists:write` | Create list |
| DELETE | `/api/lists/:id` | Session | `lists:delete` | Delete list |
| GET | `/api/lists/:id/members` | Session | `lists:read` | List members |
| POST | `/api/lists/:id/members` | Session | `lists:write` | Add member `{ contactId }` |
| DELETE | `/api/lists/:id/members/:contactId` | Session | `lists:write` | Remove member |

---

## Segments

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/segments` | Session | `segments:read` | List segments |
| POST | `/api/segments` | Session | `segments:write` | Create `{ name, definition }` |
| DELETE | `/api/segments/:id` | Session | `segments:delete` | Delete segment |
| GET | `/api/segments/:id/evaluate` | Session | `segments:read` | Evaluate rules → contact IDs |

**Segment definition:** `{ combinator: 'and'|'or', rules: [{ field, op, value }] }`

---

## Suppressions

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/suppressions` | Session | `suppressions:read` | List suppressions |
| POST | `/api/suppressions` | Session | `suppressions:write` | Add `{ email, reason }` |
| DELETE | `/api/suppressions/:id` | Session | `suppressions:write` | Remove suppression |

---

## Templates

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/templates` | Session | `templates:read` | List templates |
| GET | `/api/templates/:id` | Session | `templates:read` | Get template |
| POST | `/api/templates` | Session | `templates:write` | Create |
| PATCH | `/api/templates/:id` | Session | `templates:write` | Update (creates version) |
| DELETE | `/api/templates/:id` | Session | `templates:delete` | Soft delete |
| GET | `/api/templates/:id/versions` | Session | `templates:read` | Version history |
| POST | `/api/templates/:id/preview` | Session | `templates:read` | Render preview `{ variables }` |
| POST | `/api/templates/:id/test-send` | Session | `templates:write` | Send test `{ toEmail, variables? }` |

---

## Campaigns

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/campaigns` | Session | `campaigns:read` | List campaigns |
| GET | `/api/campaigns/:id` | Session | `campaigns:read` | Get campaign |
| GET | `/api/campaigns/:id/stats` | Session | `campaigns:read` | Stats rollup |
| POST | `/api/campaigns` | Session | `campaigns:write` | Create |
| POST | `/api/campaigns/:id/send` | Session | `campaigns:write` | Send now |
| POST | `/api/campaigns/:id/schedule` | Session | `campaigns:write` | Schedule `{ scheduledAt }` |
| DELETE | `/api/campaigns/:id` | Session | `campaigns:delete` | Soft delete |

---

## Inbound (legacy thread API)

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/inbound/threads` | Session | `inbound:read` | List legacy threads |
| GET | `/api/inbound/threads/:id/messages` | Session | `inbound:read` | Legacy thread messages |

Prefer `/api/conversations` for the unified inbox UI.

---

## Conversations (unified inbox)

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/conversations` | Session | `conversations:read` | List; query `channel?`, `assignedUserId?`, `unread?`, `limit?` |
| GET | `/api/conversations/:id` | Session | `conversations:read` | Detail + messages + notes |
| GET | `/api/conversations/:id/messages` | Session | `conversations:read` | Paginated message history |
| POST | `/api/conversations/:id/messages` | Session | `conversations:write` | Reply `{ body, channel? }` (email or sms) |
| POST | `/api/conversations/:id/assign` | Session | `conversations:write` | Assign `{ userId \| null }` |
| POST | `/api/conversations/:id/read` | Session | `conversations:write` | Mark read |
| POST | `/api/conversations/:id/notes` | Session | `conversations:write` | Internal note `{ body }` |

---

## Companies

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/companies` | Session | `companies:read` | List; query `q?`, `ownerUserId?` |
| GET | `/api/companies/:id` | Session | `companies:read` | Get one + linked contacts |
| POST | `/api/companies` | Session | `companies:write` | Create |
| PATCH | `/api/companies/:id` | Session | `companies:write` | Update |
| DELETE | `/api/companies/:id` | Session | `companies:delete` | Soft delete |

---

## Pipelines & deals

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/pipelines` | Session | `pipelines:read` | List pipelines + stages |
| POST | `/api/pipelines` | Session | `pipelines:write` | Create with initial stages |
| PATCH | `/api/pipelines/:id/stages` | Session | `pipelines:write` | Full-replace stages |
| DELETE | `/api/pipelines/:id` | Session | `pipelines:delete` | Delete (409 if deals exist) |
| GET | `/api/deals` | Session | `deals:read` | List; filter by pipeline/stage/owner/status |
| GET | `/api/deals/:id` | Session | `deals:read` | Get one |
| POST | `/api/deals` | Session | `deals:write` | Create |
| PATCH | `/api/deals/:id` | Session | `deals:write` | Update fields |
| POST | `/api/deals/:id/move` | Session | `deals:write` | Move stage `{ stageId }` |
| DELETE | `/api/deals/:id` | Session | `deals:delete` | Soft delete |

---

## Tasks, notes, tags, custom fields

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/tasks` | Session | `tasks:read` | List; filter `entityType?`, `entityId?`, `assigneeUserId?` |
| POST | `/api/tasks` | Session | `tasks:write` | Create |
| PATCH | `/api/tasks/:id` | Session | `tasks:write` | Update |
| DELETE | `/api/tasks/:id` | Session | `tasks:delete` | Soft delete |
| GET | `/api/notes` | Session | `notes:read` | List; filter `entityType`, `entityId` |
| POST | `/api/notes` | Session | `notes:write` | Create |
| DELETE | `/api/notes/:id` | Session | `notes:delete` | Hard delete |
| GET | `/api/tags` | Session | `tags:read` | List tags |
| POST | `/api/tags` | Session | `tags:write` | Create |
| DELETE | `/api/tags/:id` | Session | `tags:delete` | Delete |
| GET | `/api/custom-fields` | Session | `custom-fields:read` | List definitions |
| POST | `/api/custom-fields` | Session | `custom-fields:write` | Create definition |
| GET | `/api/custom-fields/values` | Session | `custom-fields:read` | Get values for entity |
| PUT | `/api/custom-fields/values` | Session | `custom-fields:write` | Upsert values |

---

## Twilio

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/twilio/status` | Session | `twilio:provision` | Provisioning status |
| POST | `/api/twilio/provision` | Session | `twilio:provision` | Create subaccount + store encrypted token |
| GET | `/api/phone-numbers` | Session | `phone-numbers:read` | List tenant numbers |
| GET | `/api/phone-numbers/search` | Session | `phone-numbers:read` | Search available numbers |
| POST | `/api/phone-numbers` | Session | `phone-numbers:write` | Purchase `{ e164Number }` |
| PATCH | `/api/phone-numbers/:id` | Session | `phone-numbers:write` | Update assignee/forwardTo |
| DELETE | `/api/phone-numbers/:id` | Session | `phone-numbers:delete` | Release number |
| POST | `/api/sms/send` | Session | `calls:write` | Send SMS `{ contactId, fromNumberId, body }` |
| GET | `/api/calls` | Session | `calls:read` | List call log |
| GET | `/api/calls/:id` | Session | `calls:read` | Get call + voicemail |
| POST | `/api/calls` | Session | `calls:write` | Outbound dial `{ contactId, fromNumberId }` |
| PATCH | `/api/calls/:id/disposition` | Session | `calls:write` | Set disposition |

---

## Automations (legacy, read-only)

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/automations` | Session | `automations:read` | List automations (migrated data) |
| GET | `/api/automations/:id` | Session | `automations:read` | Get automation |
| GET | `/api/automations/:id/enrollments` | Session | `automations:read` | Legacy enrollment states |
| POST | `/api/automations` | Session | `automations:write` | **410 Gone** — use `/api/workflows` |
| POST | `/api/automations/:id/status` | Session | `automations:write` | **410 Gone** |
| DELETE | `/api/automations/:id` | Session | `automations:delete` | **410 Gone** |

---

## Workflows

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/workflows` | Session | `workflows:read` | List workflows |
| GET | `/api/workflows/:id` | Session | `workflows:read` | Get workflow + draft/published versions |
| POST | `/api/workflows` | Session | `workflows:write` | Create draft `{ name, definition }` |
| PUT | `/api/workflows/:id/draft` | Session | `workflows:write` | Replace draft definition |
| POST | `/api/workflows/:id/publish` | Session | `workflows:publish` | Publish draft as live version |
| POST | `/api/workflows/:id/pause` | Session | `workflows:write` | Pause published workflow |
| POST | `/api/workflows/:id/resume` | Session | `workflows:write` | Resume paused workflow |
| POST | `/api/workflows/:id/test-run` | Session | `workflows:write` | Dry-run against `{ contactId }` |
| GET | `/api/workflows/:id/runs` | Session | `workflows:read` | List runs (`?status=` filter) |
| GET | `/api/workflows/runs/:runId/steps` | Session | `workflows:read` | Step-level execution log |

**Workflow definition (step-list builder format):**

```json
{
  "trigger": { "type": "contact.created", "config": {} },
  "steps": [
    { "type": "send_email", "templateId": "uuid", "fromEmail": "...", "fromName?": "..." },
    { "type": "delay", "durationSeconds": 86400 },
    { "type": "condition", "field": "email", "op": "contains", "value": "vip", "thenStep": 3, "elseStep": 4 },
    { "type": "send_sms", "body": "...", "fromNumberId?": "uuid" },
    { "type": "add_tag", "tagId": "uuid" },
    { "type": "create_task", "title": "Follow up" },
    { "type": "stop" }
  ]
}
```

Triggers wired: `contact.created`, `tag.added`, `pipeline_stage.changed`, `email.opened`, `email.clicked`, `sms.received`, `call.missed`, `manual`.

---

## Analytics

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/analytics/overview` | Session | `analytics:read` | 30-day summary stats |
| GET | `/api/analytics/timeseries` | Session | `analytics:read` | Daily timeseries |

---

## Settings

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/settings` | Session | `settings:read` | Tenant settings |
| PUT | `/api/settings` | Session | `settings:write` | Update retention days, webhook key |

---

## Usage

| Method | Path | Auth | Perm | Description |
|---|---|---|---|---|
| GET | `/api/usage` | Session | `usage:read` | Inventory + monthly volumes |

---

## Permissions reference

All permission strings (`packages/db/src/entities/role.entity.ts`):

```
users:read, users:write, users:delete
tenants:read, tenants:write
audit:read
sendgrid:provision
senders:read, senders:write
domains:read, domains:write
messages:read, messages:write
events:read
contacts:read, contacts:write, contacts:delete
lists:read, lists:write, lists:delete
segments:read, segments:write, segments:delete
suppressions:read, suppressions:write
templates:read, templates:write, templates:delete
campaigns:read, campaigns:write, campaigns:delete
inbound:read
automations:read, automations:write, automations:delete
analytics:read
settings:read, settings:write
usage:read
companies:read, companies:write, companies:delete
pipelines:read, pipelines:write, pipelines:delete
deals:read, deals:write, deals:delete
tasks:read, tasks:write, tasks:delete
notes:read, notes:write, notes:delete
tags:read, tags:write, tags:delete
custom-fields:read, custom-fields:write, custom-fields:delete
twilio:provision
phone-numbers:read, phone-numbers:write, phone-numbers:delete
calls:read, calls:write
conversations:read, conversations:write
workflows:read, workflows:write, workflows:publish
```

**Defined but unused on routes:** `users:delete`, `tenants:write` (no controller routes reference them today).

---

## Planned routes (not implemented)

Do **not** call these — they do not exist. Full planned API design: `docs/05-api-design.md`.

Examples: `/api/forms/*`, `/api/calendar/*`, `/api/invoices/*`, `/api/webhooks/stripe`.
