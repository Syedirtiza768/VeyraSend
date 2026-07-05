# 05 — API Design

## Conventions (unchanged from existing platform, apply to every new route)

- Prefix `/api`, no version segment (existing convention — introducing
  `/api/v1` now, mid-platform, is a bigger call than this brief needs;
  flagged as an open question in `22-open-questions-and-decisions.md` for
  if/when a public external API is built for the agency layer).
- Auth: session cookie by default; `@Public()` opts a route out (webhooks,
  booking pages, public forms, `/api/install`).
- CSRF: double-submit token required on all mutating routes by default;
  `@SkipCsrf()` opts out (webhooks only — they authenticate via provider
  signature instead).
- AuthZ: `@Permissions('resource:action')` on every non-public route.
  Permission strings for new modules follow the existing
  `resource:read|write|delete` shape (e.g. `deals:write`, `workflows:publish`
  as a fourth verb where publish is meaningfully distinct from write).
- Tenant scoping: every handler resolves `tenantId` from the session-derived
  `TenantContextService` — **never** from a request body/param/header. Any
  DTO that includes a client-supplied `tenantId` field is a review-blocking
  bug (existing rule, ADR-0002, unchanged).
- Validation: `class-validator` DTOs on every request body, `zod` for shared
  cross-package schemas (workflow DSL, form field defs) — same split as
  today.
- Errors: existing `ApiError { error: { code, message } }` shape from
  `packages/shared`, extended with new `code` values per module below (list
  each phase's new codes in that phase's spec, not enumerated exhaustively
  here to avoid drift).
- Response envelope: existing `ApiResult<T> { data: T }` shape retained.

## Existing route groups (unchanged — full detail in `00-current-state-audit.md` §3)

`/api/auth/*`, `/api/install`, `/api/tenants/current`, `/api/users/*`,
`/api/contacts/*`, `/api/lists/*`, `/api/segments/*`, `/api/templates/*`,
`/api/campaigns/*`, `/api/messages/*`, `/api/senders/*`, `/api/domains/*`,
`/api/suppressions/*`, `/api/webhooks/events`, `/api/webhooks/inbound`,
`/api/inbound/*`, `/api/events`, `/api/analytics/*`, `/api/audit`,
`/api/settings`, `/api/usage`, `/api/automations/*` (superseded by
`/api/workflows/*`, kept read-only during migration — see
`09-workflow-engine.md`), `/api/sendgrid/*`.

`/api/contacts/*` gains new sub-routes in Phase 12 (below); all other
existing routes are additive-only (new optional fields), never breaking.

## `/api/launchpad`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/launchpad/status` | Read-only rollup of setup-checklist item states (sender verified? domain authenticated? contacts imported? pipeline created? — items appear only for modules that exist in the current phase) | any authenticated user (no specific permission — it reveals only boolean completion states, and each linked action is gated by its own screen's permissions) |

## `/api/companies`

| Method | URL | Purpose | Request | Response | Perm |
|---|---|---|---|---|---|
| GET | `/api/companies` | List (paginated, filter by name/owner) | query: `q?, ownerUserId?, limit?, cursor?` | `{ data: Company[], nextCursor? }` | `companies:read` |
| GET | `/api/companies/:id` | Get one + linked contacts | — | `{ data: Company & { contacts: Contact[] } }` | `companies:read` |
| POST | `/api/companies` | Create | `{ name, domain?, industry?, phone?, address?, ownerUserId? }` | `{ data: Company }` | `companies:write` |
| PATCH | `/api/companies/:id` | Update | partial of above | `{ data: Company }` | `companies:write` |
| DELETE | `/api/companies/:id` | Soft delete | — | `204` | `companies:delete` |

Validation: `name` required non-empty; `domain` must be a bare hostname (no
scheme) if present. Errors: `404 company_not_found` (cross-tenant lookups
return 404, never 403, per existing tenant-isolation convention).

## `/api/contacts` (new sub-routes)

| Method | URL | Purpose |
|---|---|---|
| POST | `/api/contacts/:id/tags` | Attach tag(s), body `{ tagIds: string[] }` |
| DELETE | `/api/contacts/:id/tags/:tagId` | Detach tag |
| GET | `/api/contacts/:id/timeline` | Aggregated timeline (audit + messages + calls + deal stage changes), paginated by cursor |
| POST | `/api/contacts/export` | Export filtered/segmented contacts as CSV, returns a signed download URL (async job for >5k rows, sync response otherwise) |
| GET | `/api/contacts/duplicates` | Best-effort duplicate report (exact email match only, per feature matrix "Deferred" note) |

## `/api/pipelines` and `/api/deals`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/pipelines` | List pipelines + stages | `pipelines:read` |
| POST | `/api/pipelines` | Create pipeline (with initial stages) | `pipelines:write` |
| PATCH | `/api/pipelines/:id/stages` | Reorder/rename/add/remove stages, body `{ stages: StageInput[] }` (full-replace, not per-stage PATCH, to keep ordering atomic) | `pipelines:write` |
| DELETE | `/api/pipelines/:id` | Delete (blocked with `409 pipeline_has_deals` if any non-deleted deal references it) | `pipelines:delete` |
| GET | `/api/deals` | List, filter by `pipelineId?, stageId?, ownerUserId?, status?` | `deals:read` |
| GET | `/api/deals/:id` | Get one | `deals:read` |
| POST | `/api/deals` | Create, body `{ pipelineId, stageId, name, contactId?, companyId?, valueCents?, ownerUserId? }` | `deals:write` |
| PATCH | `/api/deals/:id` | Update fields | `deals:write` |
| POST | `/api/deals/:id/move` | Move stage, body `{ stageId }` — separate endpoint (not folded into generic PATCH) because a stage move fires a workflow trigger and must be atomic + audited distinctly from a field edit | `deals:write` |
| DELETE | `/api/deals/:id` | Soft delete | `deals:delete` |

Validation: `stageId` must belong to `pipelineId` (400 `stage_pipeline_mismatch`
otherwise). Move to a stage with `is_won`/`is_lost` sets `deals.status`
accordingly server-side — client cannot set `status` directly to
`won`/`lost` without going through `/move` to the corresponding stage
(prevents a won/lost deal existing outside the stage it implies).

## `/api/tags`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/tags` | List tags with per-tag contact counts | `tags:read` |
| POST | `/api/tags` | Create, body `{ name, color? }` (409 `tag_name_taken` on duplicate) | `tags:write` |
| PATCH | `/api/tags/:id` | Rename/recolor | `tags:write` |
| DELETE | `/api/tags/:id` | Delete (also removes its `contact_tags` rows; response includes the removed-assignment count for the UI confirm dialog) | `tags:delete` |

## `/api/tasks` and `/api/notes`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/tasks` | List, filter `entityType?, entityId?, assigneeUserId?, status?, dueBefore?` | `tasks:read` |
| POST | `/api/tasks` | Create, body `{ title, description?, dueAt?, assigneeUserId?, entityType, entityId }` | `tasks:write` |
| PATCH | `/api/tasks/:id` | Update / mark done | `tasks:write` |
| DELETE | `/api/tasks/:id` | Delete | `tasks:delete` |
| GET | `/api/notes?entityType=&entityId=` | List notes for an entity | `notes:read` |
| POST | `/api/notes` | Create, body `{ body, entityType, entityId }` | `notes:write` |
| DELETE | `/api/notes/:id` | Delete | `notes:delete` |

Validation: `entityType` is a fixed enum (`contact`|`deal`|`company`);
service layer verifies `entityId` exists in the corresponding table for the
tenant before insert (400 `entity_not_found` otherwise — this is the
application-level polymorphic FK check called out in `04-database-schema.md`).

## `/api/conversations` and `/api/messages` (unified)

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/conversations` | List, filter `channel?, assignedUserId?, unread?`, sorted by `lastMessageAt desc`, cursor-paginated | `conversations:read` |
| GET | `/api/conversations/:id` | Get one + last N messages | `conversations:read` |
| GET | `/api/conversations/:id/messages` | Paginated message history | `conversations:read` |
| POST | `/api/conversations/:id/messages` | Send a reply on this conversation's channel, body `{ body, channel? }` (channel defaults to the conversation's last-used channel; sending on a different channel than the thread's primary channel is allowed and creates a message with that channel tagged) | `conversations:write` |
| POST | `/api/conversations/:id/assign` | Assign to a user, body `{ userId | null }` | `conversations:write` |
| POST | `/api/conversations/:id/read` | Mark read | `conversations:write` |
| POST | `/api/conversations/:id/notes` | Internal note (not sent to contact) | `conversations:write` |

Errors: `POST .../messages` on a channel with no configured sender/number
for the tenant returns `422 channel_not_configured` (e.g., replying via SMS
with no Twilio number assigned) rather than silently failing in the queue.

## `/api/email/templates/*` and `/api/email/campaigns/*`

These are the existing `/api/templates/*` and `/api/campaigns/*` routes.
The brief's requested paths (`/api/email/templates/*`, `/api/email/campaigns/*`)
are **not** adopted as a rename — renaming a working, tested route breaks
every existing frontend call site for no functional gain. Document the
brief's naming as an alias-only concept; if a `/api/email/*` namespace is
wanted later (e.g., to sit alongside a new `/api/sms/*` namespace
symmetrically), that's a routing-table addition (thin aliases), not a
rename, and should be its own small ADR.

## `/api/sendgrid/webhooks/*` (existing, path note)

Existing routes are `/api/webhooks/events` and `/api/webhooks/inbound`
(not nested under `/api/sendgrid/`). Same non-rename rule as above applies.
New Twilio/Stripe webhook routes are added under the existing flat
`/api/webhooks/*` namespace for consistency with what's already there:
`/api/webhooks/twilio/sms`, `/api/webhooks/twilio/voice`,
`/api/webhooks/stripe`.

## `/api/phone-numbers`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/phone-numbers` | List available-to-buy + owned numbers | `phone-numbers:read` |
| GET | `/api/phone-numbers/search?areaCode=` | Search Twilio available numbers | `phone-numbers:read` |
| POST | `/api/phone-numbers` | Purchase + assign, body `{ e164Number, assignedUserId? }` | `phone-numbers:write` |
| PATCH | `/api/phone-numbers/:id` | Reassign / update forwarding config | `phone-numbers:write` |
| DELETE | `/api/phone-numbers/:id` | Release number (calls Twilio release; irreversible — confirm in UI) | `phone-numbers:delete` |

## `/api/calls`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/calls` | List, filter `contactId?, direction?, status?` | `calls:read` |
| GET | `/api/calls/:id` | Get one + recording/voicemail if present | `calls:read` |
| POST | `/api/calls` | Initiate outbound call, body `{ contactId, fromNumberId }` — returns immediately with `status: queued`, actual connection happens via TwiML webhook callback | `calls:write` |
| PATCH | `/api/calls/:id/disposition` | Set disposition + optional note | `calls:write` |

## `/api/workflows`

Full lifecycle documented in `09-workflow-engine.md`; route summary:

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/workflows` | List | `workflows:read` |
| GET | `/api/workflows/:id` | Get + current draft/published version | `workflows:read` |
| POST | `/api/workflows` | Create (starts as draft v1) | `workflows:write` |
| PUT | `/api/workflows/:id/draft` | Replace draft definition (full DSL body), does not affect published version | `workflows:write` |
| POST | `/api/workflows/:id/publish` | Publish draft as new version, becomes live | `workflows:publish` |
| POST | `/api/workflows/:id/pause` / `/resume` | Toggle | `workflows:write` |
| POST | `/api/workflows/:id/test-run` | Execute against one supplied contact id in safe mode (no external sends — see `09-workflow-engine.md` §7) | `workflows:write` |
| GET | `/api/workflows/:id/runs` | List runs, filter `status?` | `workflows:read` |
| GET | `/api/workflows/runs/:runId/steps` | Step-level execution detail | `workflows:read` |

## `/api/calendar` and `/api/appointments`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET | `/api/calendar` | List tenant's calendars | `calendar:read` |
| POST | `/api/calendar` | Create calendar | `calendar:write` |
| PATCH | `/api/calendar/:id/availability` | Set weekly availability rules | `calendar:write` |
| GET | `/api/calendar/:slug/public-slots` | **Public**, no auth — available slots for a booking link, query `{ from, to, timezone }` | `@Public()` |
| POST | `/api/appointments` | **Public** booking action, body `{ calendarSlug, contactEmail, contactPhone?, startsAt, appointmentType? }` — creates/resolves contact + appointment; rate-limited by IP | `@Public()` |
| GET | `/api/appointments` | List (internal) | `appointments:read` |
| POST | `/api/appointments/:id/reschedule` | body `{ startsAt }` | `appointments:write` |
| POST | `/api/appointments/:id/cancel` | | `appointments:write` |
| POST | `/api/appointments/:id/no-show` | Mark no-show | `appointments:write` |

Public booking endpoints get their own stricter rate limit
(`16-security-compliance.md`) since they're unauthenticated by design.

## `/api/forms` and `/api/funnels`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET/POST | `/api/forms` | CRUD form definitions | `forms:read`/`write` |
| PATCH | `/api/forms/:id/fields` | Full-replace field list (ordering matters, same atomic-replace pattern as pipeline stages) | `forms:write` |
| POST | `/api/forms/:id/submit` | **Public**, honeypot + IP rate-limited, body = arbitrary field map + hidden `utm` fields | `@Public()` |
| GET | `/api/forms/:id/submissions` | List (internal) | `forms:read` |
| GET/POST | `/api/funnels` | CRUD funnel + steps | `funnels:read`/`write` |
| GET | `/api/funnels/pages/:slug` | **Public** — rendered landing page JSON (frontend renders it) | `@Public()` |

## `/api/reputation`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| POST | `/api/reputation/requests` | Send a review request, body `{ contactId, channel }` | `reputation:write` |
| GET | `/api/reputation/requests` | List + status | `reputation:read` |
| GET/PATCH | `/api/reputation/settings` | Google review link, widget config | `reputation:read`/`write` |

## `/api/billing` and `/api/usage`

| Method | URL | Purpose | Perm |
|---|---|---|---|
| GET/POST | `/api/billing/invoices` | Invoice CRUD | `billing:read`/`write` |
| POST | `/api/billing/invoices/:id/send` | Send invoice email/SMS with payment link | `billing:write` |
| POST | `/api/billing/payment-links` | Standalone payment link (text-to-pay) | `billing:write` |
| GET | `/api/usage` | Existing route, extended with `provider` breakdown (sendgrid/twilio/stripe) | `usage:read` |
| GET | `/api/usage/agency-rollup` | Agency-level cross-sub-account usage, only valid on an agency tenant | `usage:read` + agency context |

## `/api/audit-logs` (existing `/api/audit`, extended)

Existing route retained; extended filter params `entityType?, actorUserId?,
dateFrom?, dateTo?`. Agency admins acting cross-account (§`15-saas-multitenancy-rbac.md`)
get an additional `GET /api/audit-logs/agency` view showing elevation events
across sub-accounts.

## Error case conventions (apply platform-wide, new modules included)

- Cross-tenant lookup → `404`, never `403` (existing rule, prevents
  confirming resource existence to an unauthorized caller).
- Missing/invalid CSRF → `403 csrf_invalid`.
- Missing permission → `403 forbidden`.
- Provider (Twilio/SendGrid/Stripe) call failure after retries exhausted →
  `502 provider_unavailable` with the underlying provider error code in
  `detail` (never leak provider secrets in the error body).
- Rate-limited public endpoint → `429 rate_limited`.
