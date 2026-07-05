# 04 — Database Schema

PostgreSQL 16 via TypeORM, **migrations only** (`synchronize: false`
everywhere — unchanged from ADR-0002/0006). All new tables follow the
existing conventions: `id uuid default gen_random_uuid() primary key`,
`created_at timestamptz not null default now()`, `updated_at timestamptz not
null default now()`, `tenant_id uuid not null references tenants(id)` on
every tenant-scoped table with a btree index on `(tenant_id, ...)` for the
table's common filter, and an RLS policy added in the **same migration** as
the table (ADR-0002 rule, carried forward verbatim).

## 0. Naming reconciliation — do not rename existing tables

The brief's requested table list uses generic names (`email_templates`,
`email_campaigns`, `sendgrid_events`, `roles`, etc.). The existing schema
already implements equivalents under different names. **Do not rename working
tables** — map conceptually instead:

| Brief's name | Existing table | Status |
|---|---|---|
| `users` | `users` | Existing, unchanged |
| `tenants` | `tenants` | Existing, extended (§2) |
| `tenant_members` | `tenant_memberships` | Existing, unchanged |
| `roles` | `roles` | Existing, unchanged |
| `permissions` | *(none — permissions are a `text[]` column on `roles`)* | See §2 note |
| `contacts` | `contacts` | Existing, extended (§3) |
| `email_templates` | `templates` + `template_versions` | Existing, unchanged |
| `email_campaigns` | `campaigns` | Existing, unchanged |
| `email_campaign_recipients` | *(none — recipients derived from segment at send time, not materialized)* | See §5 note |
| `sendgrid_events` | `email_events` | Existing, unchanged |
| `audit_logs` | `audit_logs` | Existing, unchanged |
| `provider_credentials` | `tenant_sendgrid_settings` (SendGrid) + new `tenant_twilio_settings` + new `tenant_stripe_settings` | See §9 note |
| `integration_accounts` | Folded into the per-provider settings tables above | See §9 note |
| everything else in the brief's list | net new | §3–§9 below |

## 1. Identity & access (existing, unchanged)

### `users`
Purpose: global identity, not tenant-scoped (a user can belong to multiple
tenants via membership). Columns: `id`, `email` (unique), `password_hash`,
`name`, `created_at`, `updated_at`. Indexes: unique on `email`. Tenant
isolation: none (global). Soft delete: none. Audit: login/create/update
logged via `audit_logs` scoped to the tenant the action occurred in.

### `tenants`
Purpose: a business/workspace (or, after this expansion, an agency or
sub-account). Columns: `id`, `name`, `slug` (unique), `created_at`,
`updated_at`, `deleted_at`. **New columns (this expansion):**
`parent_tenant_id uuid null references tenants(id)`, `type varchar not null
default 'direct'` (`direct`|`agency`|`sub_account`), `white_label_config
jsonb null` (P18). Index: `(parent_tenant_id)`. Soft delete: yes
(`deleted_at`). Audit: tenant create/update in `audit_logs`.

### `tenant_memberships`
Purpose: user↔tenant↔role binding. Columns: `id`, `tenant_id`, `user_id`,
`role_id`, `created_at`, `updated_at`. Unique: `(tenant_id, user_id)`.
Tenant isolation: standard. Audit: membership create/role-change logged.

### `roles`
Purpose: tenant-scoped role with inline permissions. Columns: `id`,
`tenant_id`, `name`, `is_system boolean`, `permissions text[]`, `created_at`,
`updated_at`. **Note on `permissions` table:** the brief lists a separate
`permissions` table; the existing design stores permissions as a
`text[]` column on `roles` rather than a normalized permissions table +
role_permissions join. Recommendation: **keep this** — permission strings
are a fixed, code-defined enum (`resource:action`), not user-editable data,
so a join table would add query cost with no flexibility benefit. Revisit
only if permissions need to be assignable directly to a user outside a role.

### `audit_logs`
Purpose: immutable audit trail. Columns: `id`, `tenant_id`, `actor_user_id`
(nullable — system actions), `action`, `entity_type`, `entity_id` (nullable
uuid), `detail jsonb`, `created_at`. Index: `(tenant_id, created_at desc)`,
`(tenant_id, entity_type, entity_id)`. No soft delete (append-only,
never updated or deleted except by retention policy).

## 2. CRM core (new — Phase 12)

### `companies`
Purpose: organizations, one-to-many with contacts. Columns: `id`,
`tenant_id`, `name`, `domain varchar null`, `industry varchar null`,
`phone varchar null`, `address jsonb null`, `owner_user_id uuid null
references users(id)`, `created_at`, `updated_at`, `deleted_at`. Indexes:
`(tenant_id, name)`, `(tenant_id, domain)`. Tenant isolation: standard +
RLS. Soft delete: yes. Audit: create/update/delete/owner-change.

### `contacts` (existing, extended)
New columns added via migration: `company_id uuid null references
companies(id)`, `owner_user_id uuid null references users(id)`,
`lead_source varchar null`, `lifecycle_stage varchar null default 'lead'`
(`lead`|`mql`|`sql`|`customer`|`other`), `phone varchar null` (needed once
SMS/voice attribution requires phone-based contact resolution, not just
email). Existing columns unchanged: `email`, `first_name`, `last_name`,
`status`, `custom_fields jsonb` (retained for backward compat; new
tenant-defined fields should prefer `custom_field_values`, §2 below, going
forward — `custom_fields` is not migrated wholesale to avoid a risky
data migration; both coexist, documented in `22-open-questions-and-decisions.md`).
New index: `(tenant_id, phone)`, `(tenant_id, company_id)`,
`(tenant_id, owner_user_id)`.

### `pipelines`
Purpose: named deal pipelines, multiple per tenant. Columns: `id`,
`tenant_id`, `name`, `is_default boolean default false`, `created_at`,
`updated_at`. Index: `(tenant_id)`. Soft delete: no (pipelines are
structural; deleting one requires reassigning its deals first — enforced in
service layer, not DB).

### `pipeline_stages`
Purpose: ordered stages within a pipeline. Columns: `id`, `tenant_id`,
`pipeline_id`, `name`, `position int`, `probability int null` (0–100, for
weighted forecasting), `is_won boolean default false`, `is_lost boolean
default false`, `created_at`, `updated_at`. Index: `(tenant_id, pipeline_id,
position)`. FK: `pipeline_id references pipelines(id) on delete cascade`.

### `deals`
Purpose: opportunities. Columns: `id`, `tenant_id`, `pipeline_id`,
`stage_id`, `contact_id uuid null`, `company_id uuid null`, `name`,
`value_cents bigint null`, `currency varchar(3) default 'USD'`,
`owner_user_id uuid null`, `status varchar default 'open'`
(`open`|`won`|`lost`), `expected_close_date date null`, `created_at`,
`updated_at`, `deleted_at`. Indexes: `(tenant_id, pipeline_id, stage_id)`,
`(tenant_id, contact_id)`, `(tenant_id, owner_user_id)`. FKs to
`pipelines`, `pipeline_stages`, `contacts`, `companies`. Soft delete: yes.
Audit: create/update/stage-change/won/lost — stage changes are also a
`workflows` trigger source (§6).

### `tasks`
Purpose: to-dos linked to a contact/deal/company. Columns: `id`,
`tenant_id`, `title`, `description text null`, `due_at timestamptz null`,
`status varchar default 'open'` (`open`|`done`), `assignee_user_id uuid
null`, `entity_type varchar` (`contact`|`deal`|`company`), `entity_id uuid`,
`created_at`, `updated_at`, `deleted_at`. Index: `(tenant_id, entity_type,
entity_id)`, `(tenant_id, assignee_user_id, status)`. Polymorphic FK is
enforced at the application layer (no DB-level polymorphic FK in Postgres);
service layer validates `entity_id` exists in the table named by
`entity_type` before insert.

### `notes`
Purpose: free-text notes, polymorphic same as `tasks`. Columns: `id`,
`tenant_id`, `body text`, `author_user_id uuid`, `entity_type varchar`,
`entity_id uuid`, `created_at`, `updated_at`. Index: `(tenant_id,
entity_type, entity_id, created_at desc)`. No soft delete (notes are
append-only in the timeline; deletion is a hard delete with an audit_log
entry recording what was deleted, since keeping a "deleted note" visible
would be confusing in a timeline UI).

### `tags`
Purpose: tenant-scoped label vocabulary. Columns: `id`, `tenant_id`,
`name`, `color varchar null`, `created_at`. Unique: `(tenant_id, name)`.

### `contact_tags`
Purpose: many-to-many contact↔tag. Columns: `tenant_id`, `contact_id`,
`tag_id`, `created_at`. Composite PK: `(contact_id, tag_id)`. Index:
`(tenant_id, tag_id)` (for "all contacts with tag X" — a common workflow
trigger/segment query).

### `custom_fields`
Purpose: tenant-defined field definitions. Columns: `id`, `tenant_id`,
`entity_type varchar` (`contact`|`company`|`deal`), `key varchar`, `label`,
`field_type varchar` (`text`|`number`|`date`|`boolean`|`select`),
`options jsonb null` (for `select`), `created_at`, `updated_at`. Unique:
`(tenant_id, entity_type, key)`.

### `custom_field_values`
Purpose: values for the above. Columns: `id`, `tenant_id`,
`custom_field_id`, `entity_type varchar`, `entity_id uuid`, `value jsonb`,
`created_at`, `updated_at`. Index: `(tenant_id, entity_type, entity_id)`,
`(tenant_id, custom_field_id, value)` — the second index only helps for
simple equality filters on `value`; document in `05-api-design.md` that
segment/filter queries on custom fields are best-effort on JSON equality,
not full JSON-path querying, to set correct performance expectations.

## 3. Conversations & messaging (new — Phase 13/14)

### `conversations`
Purpose: one thread per contact, aggregating channels. Columns: `id`,
`tenant_id`, `contact_id`, `assigned_user_id uuid null`,
`last_message_at timestamptz`, `unread boolean default true`, `created_at`,
`updated_at`. Index: `(tenant_id, contact_id)`, `(tenant_id,
last_message_at desc)`, `(tenant_id, assigned_user_id, unread)`.

### `messages` (existing, extended — do not create a second messages table)
The existing `messages` table (kind: transactional/campaign/automation,
email-only today) is extended, not replaced, with: `conversation_id uuid
null references conversations(id)`, `channel varchar not null default
'email'` (`email`|`sms`|`mms`|`voice`|`whatsapp`), `direction varchar not
null default 'outbound'` (`inbound`|`outbound`), `provider_message_id
varchar null` (generalizes `sg_message_id` — keep `sg_message_id` as a
column for backward compat, populate both during a transition period, then
consolidate in a later cleanup migration once all readers use
`provider_message_id`). New index: `(tenant_id, conversation_id,
created_at)`.

### `email_templates` / `email_campaigns` / `email_campaign_recipients`
`email_templates` and `email_campaigns` map to the existing `templates` +
`template_versions` and `campaigns` tables. `campaigns` gains a
`channel varchar not null default 'email'` column in Phase 13 (SMS
campaigns reuse the same table/screen with a channel dimension rather than
a parallel `sms_campaigns` module — one campaign lifecycle, one stats
rollup path, channel-appropriate metrics). Otherwise unchanged.
`email_campaign_recipients`: the existing design does **not** materialize a
recipient row per contact per campaign; it resolves the target segment at
send time and creates one `messages` row per contact as it's queued/sent.
**Recommendation: keep this** for now (avoids a large row-explosion table
for big segments) but note the tradeoff: there is no persisted "who was
included in campaign X" list independent of the `messages` rows created —
if campaign-recipient auditing independent of delivery becomes a
requirement, add `email_campaign_recipients(tenant_id, campaign_id,
contact_id, created_at)` as a lightweight snapshot table in a later
migration. Flagged as an open question in `22-open-questions-and-decisions.md`.

### `sendgrid_events`
Maps to the existing `email_events` table — unchanged.

### `sms_messages`
Purpose: the brief requests a dedicated SMS table; the recommended design
(§ above) folds SMS into the extended `messages` table via `channel='sms'`
rather than a parallel table, to keep one delivery-status state machine
and one conversation-join path. **If** a dedicated `sms_messages` table is
required for provider-specific columns (e.g., Twilio's `num_segments`,
`price`, `direction` nuances), add it as a **1:1 extension table**:
`sms_messages(message_id uuid primary key references messages(id),
twilio_sid varchar, num_segments int, price_micros bigint,
price_currency varchar(3))` — this keeps the base `messages` table as the
single source of truth for status/threading while capturing SMS-specific
metadata separately. This is the recommended pattern for `calls` too (§4).

## 4. Phone & voice (new — Phase 13)

### `phone_numbers`
Purpose: Twilio numbers provisioned and assigned per tenant. Columns: `id`,
`tenant_id`, `twilio_sid`, `e164_number varchar unique`,
`capabilities jsonb` (`{sms, mms, voice}`), `assigned_user_id uuid null`
(for direct-line routing), `status varchar default 'active'`, `created_at`,
`updated_at`. Index: `(tenant_id)`.

### `calls`
Purpose: call log (base record, mirrors `messages` role for voice).
Columns: `id`, `tenant_id`, `conversation_id uuid null`, `contact_id uuid
null`, `phone_number_id uuid`, `direction varchar` (`inbound`|`outbound`),
`from_number`, `to_number`, `status varchar`
(`queued`|`ringing`|`in-progress`|`completed`|`no-answer`|`busy`|`failed`|
`voicemail`), `duration_seconds int null`, `disposition varchar null`
(manual tag, e.g. `booked`|`not-interested`|`no-answer`|`callback`),
`twilio_call_sid varchar unique null`, `started_at`, `ended_at`,
`created_at`. Index: `(tenant_id, contact_id)`, `(tenant_id,
twilio_call_sid)`.

### `call_recordings`
Purpose: 1:1 (or 1:many, for calls with multiple legs) extension of `calls`.
Columns: `id`, `tenant_id`, `call_id references calls(id)`,
`twilio_recording_sid`, `url varchar` (Twilio media URL — see
`16-security-compliance.md` for consent + storage rules), `duration_seconds
int`, `created_at`. Index: `(tenant_id, call_id)`.

### `voicemail_messages`
Purpose: voicemail-specific extension when a call ends in voicemail.
Columns: `id`, `tenant_id`, `call_id references calls(id)`,
`recording_url varchar`, `transcription text null`, `duration_seconds int`,
`created_at`. Index: `(tenant_id, call_id)`.

### `twilio_events`
Purpose: raw Twilio status-callback event log, mirrors `email_events`
pattern exactly (verify signature → dedupe → attribute → update `calls`/
`messages` status). Columns: `id`, `tenant_id`, `event_type varchar`,
`resource_sid varchar` (`CallSid` or `MessageSid`), `twilio_event_id
varchar unique null` (Twilio doesn't always provide a stable event id for
every callback type — dedupe by `(resource_sid, event_type, raw->>'Timestamp')`
composite when no discrete id exists; document this explicitly since it
differs from SendGrid's clean `sg_event_id`), `raw jsonb`, `created_at`.
Index: `(tenant_id, resource_sid)`.

## 5. Workflow engine (new — Phase 15)

Full behavioral spec in `09-workflow-engine.md`; schema here.

### `workflows`
Purpose: workflow definition header (name, current published version
pointer). Columns: `id`, `tenant_id`, `name`, `status varchar default
'draft'` (`draft`|`published`|`paused`|`archived`), `current_version_id
uuid null`, `created_at`, `updated_at`, `deleted_at`.

### `workflow_versions`
Purpose: immutable versioned definition (edit = new version, never mutate
a published version in place). Columns: `id`, `tenant_id`, `workflow_id`,
`version int`, `definition jsonb` (full trigger + action-graph DSL, see
`09-workflow-engine.md` §2), `created_at`, `created_by_user_id`. Unique:
`(workflow_id, version)`.

### `workflow_triggers`
Purpose: normalized, queryable index of what each **published** version
listens for (denormalized out of `workflow_versions.definition` so the
dispatcher can query "which workflows care about event X" without
deserializing every workflow's JSON on every event). Columns: `id`,
`tenant_id`, `workflow_id`, `workflow_version_id`, `trigger_type varchar`,
`trigger_config jsonb null` (e.g., which tag, which pipeline stage),
`created_at`. Index: `(tenant_id, trigger_type)` — this is the hot lookup
path for the dispatcher.

### `workflow_actions`
Purpose: similarly denormalized catalog of action nodes per version, mainly
for admin/analytics ("which workflows send SMS") rather than execution
(execution reads `workflow_versions.definition` directly via the run
engine). Columns: `id`, `tenant_id`, `workflow_id`, `workflow_version_id`,
`action_type varchar`, `position_in_graph varchar` (node id within the
DSL), `created_at`.

### `workflow_runs`
Purpose: one row per trigger firing → one execution instance. Columns:
`id`, `tenant_id`, `workflow_id`, `workflow_version_id`, `contact_id uuid
null`, `trigger_payload jsonb`, `status varchar` (`running`|`completed`|
`failed`|`cancelled`), `started_at`, `completed_at`, `created_at`. Index:
`(tenant_id, workflow_id, status)`, `(tenant_id, contact_id)`.

### `workflow_run_steps`
Purpose: per-node execution state within a run (this is what the existing
`AutomationEnrollment.current_step` generalizes into). Columns: `id`,
`tenant_id`, `workflow_run_id`, `node_id varchar` (matches a node id in the
version's `definition`), `status varchar` (`pending`|`running`|`completed`|
`failed`|`skipped`), `attempt int default 1`, `error text null`, `run_at
timestamptz null` (for delay nodes — when this step is eligible to run),
`completed_at`, `created_at`. Index: `(tenant_id, workflow_run_id,
node_id)`, `(status, run_at)` (global, not tenant-scoped — this is the
index the delay-step scheduler sweeps; still tenant-safe since every row
carries `tenant_id` and any query using this index filters by `tenant_id`
in addition).

## 6. Calendar & booking (new — Phase 16)

### `calendars`
Purpose: a bookable calendar (user or team). Columns: `id`, `tenant_id`,
`name`, `owner_user_id uuid null` (null = team calendar with round-robin),
`timezone varchar`, `availability jsonb` (weekly recurring rules),
`booking_slug varchar unique`, `created_at`, `updated_at`.

### `appointments`
Purpose: booked instances. Columns: `id`, `tenant_id`, `calendar_id`,
`contact_id`, `assigned_user_id uuid null` (resolved at booking time for
round-robin), `appointment_type varchar null`, `starts_at timestamptz`,
`ends_at timestamptz`, `status varchar default 'booked'`
(`booked`|`confirmed`|`cancelled`|`completed`|`no_show`), `location varchar
null`, `created_at`, `updated_at`. Index: `(tenant_id, calendar_id,
starts_at)`, `(tenant_id, contact_id)`.

## 7. Forms, funnels, pages (new — Phase 16)

### `forms`
Purpose: form definition. Columns: `id`, `tenant_id`, `name`,
`spam_protection varchar default 'honeypot'`, `redirect_url varchar null`,
`created_at`, `updated_at`, `deleted_at`.

### `form_fields`
Purpose: field definitions per form. Columns: `id`, `tenant_id`,
`form_id`, `label`, `field_key varchar` (maps to contact field or custom
field key), `field_type varchar`, `required boolean default false`,
`position int`, `created_at`. Index: `(tenant_id, form_id, position)`.

### `form_submissions`
Purpose: raw submission record, always kept even after mapping to a
contact (audit trail). Columns: `id`, `tenant_id`, `form_id`, `contact_id
uuid null`, `data jsonb`, `utm jsonb null`, `ip_address varchar null`,
`created_at`. Index: `(tenant_id, form_id, created_at desc)`.

### `landing_pages`
Purpose: single published page. Columns: `id`, `tenant_id`, `name`,
`slug varchar unique`, `content jsonb` (structured section schema, not
free HTML — see `13-forms-funnels-pages.md` for the builder architecture
decision), `published boolean default false`, `created_at`, `updated_at`.

### `funnels`
Purpose: ordered multi-page flow (e.g., landing → thank-you). Columns:
`id`, `tenant_id`, `name`, `created_at`, `updated_at`.

### `funnel_steps`
Purpose: ordering of pages within a funnel. Columns: `id`, `tenant_id`,
`funnel_id`, `landing_page_id`, `position int`, `created_at`. Index:
`(tenant_id, funnel_id, position)`.

## 8. Reputation (new — Phase 16)

### `review_requests`
Purpose: one row per request sent to a contact. Columns: `id`,
`tenant_id`, `contact_id`, `channel varchar` (`email`|`sms`), `review_link
varchar`, `status varchar default 'sent'` (`sent`|`clicked`|`completed`),
`sent_at`, `created_at`. Index: `(tenant_id, contact_id)`.

## 9. Payments (new — Phase 17)

### `invoices`
Purpose: invoice/estimate record. Columns: `id`, `tenant_id`, `contact_id`,
`status varchar default 'draft'` (`draft`|`sent`|`paid`|`void`),
`line_items jsonb`, `total_cents bigint`, `currency varchar(3)`,
`stripe_invoice_id varchar null`, `due_date date null`, `paid_at
timestamptz null`, `created_at`, `updated_at`.

### `payment_links`
Purpose: standalone payment link (not tied to an invoice, e.g. text-to-pay).
Columns: `id`, `tenant_id`, `contact_id uuid null`, `amount_cents bigint`,
`currency varchar(3)`, `stripe_payment_link_id`, `status varchar default
'pending'` (`pending`|`paid`|`expired`), `created_at`, `updated_at`.

## Provider credentials & integrations (new + existing)

### `tenant_sendgrid_settings` (existing, unchanged)
One row per tenant: subuser username/id, encrypted API key, region.

### `tenant_twilio_settings` (new — mirrors the above exactly)
Columns: `id`, `tenant_id unique`, `twilio_subaccount_sid`,
`encrypted_auth_token text`, `messaging_service_sid varchar null`,
`created_at`, `updated_at`. Encryption: same AES-256-GCM scheme and same
`ENCRYPTION_KEY` as SendGrid — do not introduce a second encryption scheme.

### `tenant_stripe_settings` (new)
Columns: `id`, `tenant_id unique`, `stripe_account_id` (Stripe Connect
account, if using Connect for agency rebilling — see
`22-open-questions-and-decisions.md` for the Connect-vs-platform-account
decision), `encrypted_api_key text null`, `created_at`, `updated_at`.

**On `integration_accounts` / `provider_credentials` as generic tables:**
recommendation is to **not** build a generic polymorphic credentials table.
The existing `tenant_sendgrid_settings` pattern (one strongly-typed table
per provider) is easier to reason about, index, and encrypt correctly than
a generic `provider_credentials(provider, encrypted_blob jsonb)` table, and
there are only three providers (SendGrid, Twilio, Stripe) — the abstraction
cost isn't earned. Revisit only if a fourth provider with materially
different credential shape arrives.

## Cross-cutting: usage & billing

`usage_records` is created in **Phase 13** (Twilio usage/cost logging is a
Phase 13 requirement per the brief's Twilio section), gains Stripe metrics
in **Phase 17**, and gets agency rollup/rebilling consumers in **Phase 18**.
`billing_plans` and `feature_flags` are **Phase 18**.

### `usage_records`
Purpose: per-tenant, per-period, per-provider usage counters (rollup, not
raw event log — raw events live in `email_events`/`twilio_events`).
Columns: `id`, `tenant_id`, `period_start date`, `period_end date`,
`provider varchar` (`sendgrid`|`twilio`|`stripe`), `metric varchar`
(`emails_sent`|`sms_sent`|`call_minutes`|`transactions`), `quantity
bigint`, `cost_micros bigint null` (platform's cost), `billed_micros
bigint null` (rebilled-to-tenant amount, may include agency markup),
`created_at`. Unique: `(tenant_id, period_start, provider, metric)`.

### `billing_plans`
Purpose: plan catalog (platform-level, not tenant-scoped — plans are
global, tenant subscriptions reference them). Columns: `id`, `name`,
`price_cents`, `interval varchar` (`month`|`year`), `included_usage jsonb`,
`feature_flags text[]`, `created_at`, `updated_at`. No `tenant_id` — this
table is intentionally global.

### `feature_flags`
Purpose: per-tenant (or per-plan) feature gating. Columns: `id`,
`tenant_id null` (null = global default), `key varchar`, `enabled
boolean`, `created_at`, `updated_at`. Unique: `(tenant_id, key)` (with
`tenant_id` nullable, Postgres unique treats each `NULL` as distinct — use
a partial unique index `WHERE tenant_id IS NOT NULL` plus a single-row
constraint for the global default per key, or model the global default as
`tenant_id = '00000000-0000-0000-0000-000000000000'` sentinel — decide and
record in `22-open-questions-and-decisions.md`, don't leave it implicit).

## Named-but-not-yet-specified tables (design-only mentions elsewhere)

Two tables are referenced by other docs as future design sketches and are
deliberately **not** fully specified here yet — they get columns/indexes in
the spec of the phase that builds them: `google_calendar_connections`
(user-scoped OAuth tokens for the deferred Google Calendar sync,
`12-calendar-booking.md`) and `custom_domains` (agency white-label
domain→tenant routing, `17-deployment-devops.md`, Phase 18). Listing them
here prevents "the schema doc doesn't know about this table" confusion
without pretending their design is settled.

## Tenant isolation & audit — summary rule (unchanged from ADR-0002)

Every table above except `users`, `billing_plans`, and the global row of
`feature_flags` carries `tenant_id` and an RLS policy added in the same
migration that creates the table. Every mutation on every table above is
either (a) already covered by the existing global audit interceptor
pattern, or (b) explicitly logged in the relevant module's service method —
call out in each phase's spec (`18-implementation-roadmap.md`) which of the
two applies so audit coverage isn't assumed silently.
