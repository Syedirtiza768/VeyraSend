# Database Documentation (Live)

> PostgreSQL 16 · TypeORM 0.3 · `synchronize: false` · Last verified: **2026-07-05**

## Overview

- **Package:** `packages/db/`
- **Entities:** 42 `@Entity` classes across 33 files in `packages/db/src/entities/`
- **Migrations:** 17 files in `packages/db/src/migrations/` (12 schema + 5 permission backfills)
- **CLI:** `pnpm --filter @veyrasend/db migration:run`

## Entity catalog

### Global tables (no tenant_id, no RLS)

| Entity | Table | Key columns |
|---|---|---|
| `Tenant` | `tenants` | `name`, `slug` (unique), `deletedAt` |
| `User` | `users` | `email` (unique), `passwordHash`, `name` |

### Auth & tenancy

| Entity | Table | Key columns | Notes |
|---|---|---|---|
| `Role` | `roles` | `tenantId`, `name`, `isSystem`, `permissions[]` | Unique `(tenantId, name)` |
| `TenantMembership` | `tenant_memberships` | `tenantId`, `userId`, `roleId` | Only entity with TypeORM `@ManyToOne` relations |
| `AuditLog` | `audit_logs` | `tenantId`, `actorUserId`, `action`, `entityType`, `entityId`, `detail` | jsonb detail |

### SendGrid infrastructure

| Entity | Table | Key columns |
|---|---|---|
| `TenantSendgridSettings` | `tenant_sendgrid_settings` | `tenantId` (unique), `subuserUsername`, `subuserId`, `encryptedApiKey`, `apiKeyId`, `region` |
| `Sender` | `senders` | `tenantId`, `senderId`, `fromEmail`, `fromName`, `verified`, `verificationStatus` |
| `Domain` | `domains` | `tenantId`, `domainId`, `domain`, `verified`, `dns` (jsonb) |

### Messages & events

| Entity | Table | Key columns |
|---|---|---|
| `Message` | `messages` | `tenantId`, `kind`, `channel`, `direction`, `conversationId`, `callId`, `campaignId`, `fromEmail`, `toEmail`, `fromPhone`, `toPhone`, `body`, `subject`, `status`, `sgMessageId`, `providerMessageId`, `idempotencyKey` |
| `EmailEvent` | `email_events` | `tenantId`, `eventType`, `sgMessageId`, `sgEventId` (unique), `recipient`, `sgTimestamp`, `raw` |

### Audience

| Entity | Table | Key columns |
|---|---|---|
| `Contact` | `contacts` | `tenantId`, `email`, `phone`, `companyId`, `ownerUserId`, `leadSource`, `lifecycleStage`, `smsOptInStatus`, `status`, `customFields`, `deletedAt` |
| `List` | `lists` | `tenantId`, `name` |
| `ListMembership` | `list_memberships` | `tenantId`, `listId`, `contactId` |
| `Segment` | `segments` | `tenantId`, `name`, `definition` (jsonb) |
| `Suppression` | `suppressions` | `tenantId`, `email`, `reason`, `source` |

### Templates & campaigns

| Entity | Table | Key columns |
|---|---|---|
| `Template` | `templates` | `tenantId`, `name`, `subject`, `html`, `text`, `generation`, `variables`, `version`, `deletedAt` |
| `TemplateVersion` | `template_versions` | `tenantId`, `templateId`, `version`, content snapshot |
| `Campaign` | `campaigns` | `tenantId`, `name`, `templateId`, `segmentId`, `fromEmail`, `status`, `scheduledAt`, stats fields, `deletedAt` |

### CRM (Phase 12)

| Entity | Table | Key columns |
|---|---|---|
| `Company` | `companies` | `tenantId`, `name`, `domain`, `industry`, `phone`, `address`, `ownerUserId`, `deletedAt` |
| `Pipeline` | `pipelines` | `tenantId`, `name`, `isDefault` |
| `PipelineStage` | `pipeline_stages` | `tenantId`, `pipelineId`, `name`, `position`, `probability`, `isWon`, `isLost` |
| `Deal` | `deals` | `tenantId`, `pipelineId`, `stageId`, `contactId`, `companyId`, `name`, `valueCents`, `status`, `ownerUserId`, `deletedAt` |
| `Task` | `tasks` | `tenantId`, `title`, `entityType`, `entityId`, `assigneeUserId`, `dueAt`, `status`, `deletedAt` |
| `Note` | `notes` | `tenantId`, `body`, `authorUserId`, `entityType`, `entityId` |
| `Tag` | `tags` | `tenantId`, `name`, `color` |
| `ContactTag` | `contact_tags` | `tenantId`, `contactId`, `tagId` |
| `CustomField` | `custom_fields` | `tenantId`, `entityType`, `key`, `label`, `fieldType`, `options` |
| `CustomFieldValue` | `custom_field_values` | `tenantId`, `customFieldId`, `entityType`, `entityId`, `value` (jsonb) |

### Twilio (Phase 13)

| Entity | Table | Key columns |
|---|---|---|
| `TenantTwilioSettings` | `tenant_twilio_settings` | `tenantId` (unique), `twilioSubaccountSid`, `encryptedAuthToken`, `messagingServiceSid` |
| `PhoneNumber` | `phone_numbers` | `tenantId`, `twilioSid`, `e164Number` (unique), `capabilities`, `forwardTo`, `status` |
| `Call` | `calls` | `tenantId`, `contactId`, `phoneNumberId`, `direction`, `fromNumber`, `toNumber`, `status`, `twilioCallSid`, `disposition` |
| `CallRecording` | `call_recordings` | `tenantId`, `callId`, `twilioRecordingSid`, `url` |
| `VoicemailMessage` | `voicemail_messages` | `tenantId`, `callId`, `recordingUrl`, `transcription` |
| `TwilioEvent` | `twilio_events` | `tenantId`, `eventType`, `resourceSid`, `raw` |
| `UsageRecord` | `usage_records` | `tenantId`, `periodStart`, `provider`, `metric`, `quantity` |

### Conversations (Phase 14)

| Entity | Table | Key columns |
|---|---|---|
| `Conversation` | `conversations` | `tenantId`, `contactId` (unique per tenant), `assignedUserId`, `lastMessageAt`, `unread` |
| `ConversationNote` | `conversation_notes` | `tenantId`, `conversationId`, `authorUserId`, `body` |

### Inbound (legacy + unified)

| Entity | Table | Key columns |
|---|---|---|
| `InboundThread` | `inbound_threads` | `tenantId`, `fromEmail`, `toEmail`, `subject`, `messageCount`, `lastInboundAt` |
| `InboundMessage` | `inbound_messages` | `tenantId`, `threadId`, `fromEmail`, `text`, `html`, `attachments`, `receivedAt` |

New inbound email also creates rows in `messages` with `conversationId` (Phase 14).

### Automations & settings

| Entity | Table | Key columns |
|---|---|---|
| `Automation` | `automations` | `tenantId`, `name`, `status`, `definition` (jsonb), `deletedAt` |
| `AutomationEnrollment` | `automation_enrollments` | `tenantId`, `automationId`, `contactId`, `currentStep`, `state`, `nextAt`, `enrolledAt` |
| `TenantSettings` | `tenant_settings` | `tenantId` (unique), `webhookVerificationKey`, retention day fields |

## Relationships (logical)

```
Tenant ──< TenantMembership >── User
Tenant ──< Role
Tenant ──< Contact, Company, Pipeline, Deal, Conversation, PhoneNumber, ...
Contact ──< Conversation (1:1 per tenant)
Conversation ──< Message (channel: email|sms|voice)
Contact ──< ContactTag >── Tag
Company ──< Contact (optional companyId)
Pipeline ──< PipelineStage ──< Deal
List ──< ListMembership >── Contact
InboundThread ──< InboundMessage (legacy; migrated into conversations/messages)
Automation ──< AutomationEnrollment >── Contact
Call ── optional Message row (channel=voice, callId)
```

Only `TenantMembership` declares TypeORM relations in entity code. Other links are UUID columns with selective DB FKs in migrations.

## Soft delete

Tables with `deleted_at`: `tenants`, `contacts`, `templates`, `campaigns`, `automations`, `companies`, `deals`, `tasks`.

## Migrations

| # | File | Creates / alters |
|---|---|---|
| 1 | `1700000000000-InitAuthTenancy.ts` | `tenants`, `users`, `roles`, `tenant_memberships`, `audit_logs` + RLS |
| 2 | `1700000001000-SendgridSendersDomains.ts` | `tenant_sendgrid_settings`, `senders`, `domains` + RLS |
| 3 | `1700000001001-BackfillRolePermissions.ts` | Data: owner/admin SendGrid permissions |
| 4 | `1700000002000-MessagesEvents.ts` | `messages`, `email_events` + RLS |
| 5 | `1700000002001-BackfillRolesAllPhases.ts` | Data: owner/admin/member permission sets |
| 6 | `1700000003000-ContactsListsSegments.ts` | `contacts`, `lists`, `list_memberships`, `segments`, `suppressions` + RLS |
| 7 | `1700000004000-Templates.ts` | `templates`, `template_versions` + RLS |
| 8 | `1700000005000-Campaigns.ts` | `campaigns` + RLS |
| 9 | `1700000006000-Inbound.ts` | `inbound_threads`, `inbound_messages` + RLS |
| 10 | `1700000007000-Automations.ts` | `automations`, `automation_enrollments` + RLS |
| 11 | `1700000008000-TenantSettings.ts` | `tenant_settings` + RLS |
| 12 | `1700000012000-CrmCore.ts` | CRM tables + `contacts` extensions + RLS |
| 13 | `1700000012001-BackfillCrmRolePermissions.ts` | Data: CRM permissions |
| 14 | `1700000013000-TwilioPhase.ts` | Twilio tables, SMS columns on `messages`/`contacts`, `usage_records` + RLS |
| 15 | `1700000013001-BackfillTwilioRolePermissions.ts` | Data: Twilio permissions |
| 16 | `1700000014000-ConversationsPhase.ts` | `conversations`, `conversation_notes`, `messages.conversation_id`/`call_id`, data migration + RLS |
| 17 | `1700000014001-BackfillConversationRolePermissions.ts` | Data: conversations permissions |

Backfill migrations are idempotent data-only updates with no `down`.

## Row-level security

Applied to all tenant-scoped tables (40+). Policy pattern:

```sql
CREATE POLICY tenant_isolation_<table> ON "<table>"
  USING (tenant_id::text = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true));
```

RLS enabled but **not forced** — table owner bypasses. Application must set `app.tenant_id` per connection.

## Indexes & constraints

- All tenant-scoped uniques include `tenant_id`: e.g. `(tenant_id, email)`, `(tenant_id, contact_id)` on conversations.
- `email_events.sg_event_id` — global unique (dedup).
- `automation_enrollments` — unique `(automation_id, contact_id)`.
- `phone_numbers.e164_number` — global unique.

## Seed data

**Location:** `apps/api/src/seed.ts` (not in `packages/db`).

**Defaults (override via env):**

| Env var | Default |
|---|---|
| `DEMO_TENANT_SLUG` | `demo` |
| `DEMO_OWNER_EMAIL` | `owner@demo.veyrasend` |
| `DEMO_OWNER_PASSWORD` | `demo-owner-password-123` |

**Creates (idempotent):**

1. Demo tenant + owner user + system roles (via `TenantsService.createTenantWithOwner`)
2. Three sample contacts (Ada, Grace, Linus)
3. "Welcome" template with `{{first_name}}` and `{{plan}}` variables

**System roles** seeded per tenant at creation time in `TenantsService` — not via migration.

## Tables that do NOT exist (Planned — Phase 15+)

`workflows`, `workflow_versions`, `workflow_runs`, `calendars`, `appointments`, `forms`, `form_submissions`, `landing_pages`, `funnels`, `invoices`, `billing_plans`, `tenant_stripe_settings`

See planned schema: `docs/04-database-schema.md`.
