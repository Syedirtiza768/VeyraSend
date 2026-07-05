# 02 — Feature Matrix (GHL-style)

> **Live features today:** see [`docs/live/02-features.md`](live/02-features.md) and
> [`docs/system-context.md`](system-context.md). This matrix covers both Live and Planned status for the full product vision.
>
> Status values: **Live** (in the repo today) · **Planned P{n}** (scheduled in
> `18-implementation-roadmap.md`, phase number given) · **Deferred** (designed
> for, not built until demand is proven) · **Not planned** (explicitly out of
> scope, with reason). This is a living document — update it every phase, the
> same discipline `SUPPORTED.md` already applies to SendGrid.

## Core CRM

| Feature | Status | Notes |
|---|---|---|
| Contacts | Live | Company link, owner, lead source, timeline (P12) |
| Companies | Live | P12 |
| Leads | Live | `Contact.lifecycleStage` |
| Deals/opportunities | Live | P12 |
| Pipelines | Live | P12 |
| Pipeline stages | Live | P12 |
| Tasks | Live | P12 |
| Notes | Live | P12 polymorphic |
| Tags | Live | P12 API; attach UI partial |
| Custom fields | Live | P12 API; frontend partial |
| Contact timelines | Live (partial) | Audit + notes + tasks + conversation messages; deal stage via audit |
| Activity history | Live (partial) | Same as timeline |
| Owner assignment | Live | P12 |
| Lead source tracking | Live (field) · P16 (UTM auto) | Manual `lead_source` on contacts |
| Import/export | Live (contacts CSV) | Company/tag columns in import |
| Duplicate detection | Deferred | Email uniqueness only |
| Smart lists / segmentation | Live | Segments |

## Unified Conversations Inbox

| Feature | Status | Notes |
|---|---|---|
| Email in inbox | Live | Unified conversations (P14) |
| SMS in inbox | Live | Twilio + conversations adapter (P13/14) |
| Voice call logs in inbox | Live | `channel=voice` messages in conversation thread |
| Missed calls | Live | Twilio status callback + text-back stopgap |
| Voicemail | Partial | TwiML `<Record>`; persistence webhook not wired |
| WhatsApp | Deferred | |
| Website chat widget | Deferred | |
| Social DMs | Not planned (near-term) | |
| Conversation threads by contact | Live | P14 `conversations` table |
| Channel filtering | Live | `?channel=` on list API + UI chips |
| Internal notes | Live | `conversation_notes`, not sent to contact |
| Assignments | Live | `assigned_user_id` |
| Read/unread state | Live | Per-conversation `unread` boolean |
| Message status tracking | Live | Email + SMS status on `messages` |
| Delivery/bounce/failure status | Live | Email webhooks; SMS Twilio callbacks partial |
| Attachments | Live (email inbound) | MMS deferred |
| Conversation timeline | Live | `/conversations/:id/messages` |
| Contact sidebar | Partial | Contact data on detail; no dedicated sidebar panel |
| Quick replies/snippets | Deferred | |

## Email Campaign System (SendGrid)

| Feature | Status | Notes |
|---|---|---|
| Domain authentication tracking | Live | |
| Sender identity management | Live | |
| Email templates | Live | Versioned, `{{var}}` substitution |
| Drag-and-drop builder | Not planned (near-term) | Current templates are HTML+variables; a visual block builder is a large frontend investment — deferred, revisit only on explicit request |
| Campaign creation | Live | |
| Broadcast campaigns | Live | Send-now to a segment |
| Scheduled campaigns | Live | |
| Segmented campaigns | Live | |
| A/B testing | Planned P13 (email module hardening) | Subject-line/body variant split at send time, winner by open/click rate |
| Suppression list management | Live | |
| Unsubscribe handling | Live | ASM groups per ADR-0005 |
| Bounce/spam/drop tracking | Live | |
| Open/click tracking | Live | |
| Webhook processing | Live | Signature-verified, deduped |
| Campaign analytics | Live | |
| Contact-level email activity history | Live | Surfaced in contact timeline via conversation messages |
| Template variables | Live | |
| Test email sending | Live | |
| Rate-limit handling | Live | 429 handling with jittered backoff in `packages/sendgrid` |
| SendGrid error handling | Live | Typed `SendGridError` |

## SMS and Phone System (Twilio)

| Feature | Status | Notes |
|---|---|---|
| Buy/connect phone numbers | Live | P13 |
| Assign numbers to tenant | Live | P13 |
| Send/receive SMS | Live | P13 |
| MMS | Partial | API shape only |
| Call forwarding | Live | TwiML `<Dial>` |
| Inbound call routing | Live | P13 |
| Outbound calling | Live | API; no dial UI |
| Call tracking | Live | `Call` entity |
| Call recordings | Partial | Table exists; ingestion not wired |
| Voicemail | Partial | TwiML only |
| Missed-call text-back | Live | P13 stopgap |
| Call disposition | Live | API |
| Call notes | Live | Polymorphic `Note` |
| Appointment reminder SMS | Planned P16 | |
| SMS campaign architecture | Planned P13 | `campaigns.channel` not migrated |
| Opt-in/opt-out compliance | Live | STOP/START |
| STOP/START keyword handling | Live | |
| Webhook validation | Live | Twilio signature |
| Twilio event logging | Partial | Table exists; not written |
| Usage/cost tracking per tenant | Partial | SMS metrics only |

## Marketing Automation / Workflow Builder

| Feature | Status | Notes |
|---|---|---|
| Existing `Automation` entity (contact.created + send/wait/branch) | Legacy | Read-only API; data migrated to `workflows` (P15) |
| Workflow engine (`workflows` module) | Live | Step-list DSL, BullMQ `workflow-run`, version pinning |
| Trigger: new contact | Live | `contact.created` |
| Trigger: form submitted | Planned P16 | Depends on forms module |
| Trigger: tag added | Live | `tag.added` |
| Trigger: pipeline stage changed | Live | `pipeline_stage.changed` |
| Trigger: email opened/link clicked | Live | `email.opened` / `email.clicked` from SendGrid events |
| Trigger: SMS received | Live | `sms.received` |
| Trigger: missed call | Live | `call.missed` (replaces P13 hardcoded text-back) |
| Trigger: appointment booked | Planned P16 | Depends on calendar module |
| Trigger: invoice paid | Live P17 | `invoice.paid` via Stripe webhook |
| Trigger: manual | Live | Test-run + future manual enroll |
| Trigger: date-based | Planned P16+ | Repeatable BullMQ scan job |
| Action: send email | Live | Enqueues on `mail` queue |
| Action: send SMS | Live | Via `SmsService` |
| Action: create task, add/remove tag | Live | |
| Action: update field, move pipeline stage, assign user | Planned P16+ | Registry stub; not all executors wired |
| Action: wait/delay | Live | BullMQ delayed job |
| Action: if/else | Live | `condition` step |
| Action: webhook call | Planned P16+ | `webhook-dispatch` queue not shipped |
| Action: internal notification | Planned P16+ | |
| Execution logs | Live | `GET /api/workflows/:id/runs`, `GET /api/workflows/runs/:runId/steps` |
| Retry system | Live | BullMQ 5 attempts on `workflow-run` |
| Queue-based processing | Live | |
| Failure handling | Live | Run/step status `failed`; no auto DLQ requeue |
| Versioning | Live | `WorkflowVersion`, draft vs published |
| Draft/published states | Live | |
| Safe testing mode | Live | `POST /api/workflows/:id/test-run` dry-run |

## Calendar and Appointment Booking

| Feature | Status | Notes |
|---|---|---|
| Calendars, team calendars | Planned P16 | |
| User availability | Planned P16 | |
| Booking links | Planned P16 | Public page, no auth |
| Appointment types | Planned P16 | |
| Time zones | Planned P16 | Store UTC, render tenant/user tz |
| Google Calendar integration | Planned P16 (architecture only in this brief) | OAuth-based 2-way sync; scoped as an integration, not a hard dependency |
| Reminders via email/SMS | Planned P16 | Workflow-triggered |
| Reschedule/cancel | Planned P16 | |
| No-show tracking | Planned P16 | |
| Round-robin assignment | Planned P16 | |
| Pipeline automation after booking | Planned P16 | Workflow trigger `appointment.booked` |

## Forms, Surveys, Funnels, Landing Pages

| Feature | Status | Notes |
|---|---|---|
| Forms | Planned P16 | Field types, validation, spam protection |
| Surveys/quizzes | Deferred | Modeled as a `Form` variant later; not core-path for MVP expansion |
| Landing pages | Planned P16 | Simple structured builder, not drag-and-drop visual editor (see below) |
| Funnels (multi-step page + thank-you) | Planned P16 | |
| Embedded forms | Planned P16 | Public embed script/iframe |
| Tracking parameters / UTM capture | Planned P16 | |
| Lead source attribution | Planned P16 | Feeds `Contact.leadSource` |
| Form submission triggers | Planned P16/P15 | Workflow trigger `form.submitted` |
| Field mapping to CRM contact | Planned P16 | |
| Spam protection | Planned P16 | Honeypot + rate limit; CAPTCHA deferred |
| Page builder architecture | Planned P16 (structured, section-based) | Full visual drag-and-drop builder is **Deferred** — large scope, revisit only on demand; ship a structured JSON-schema-driven page renderer first |

## Reputation Management

| Feature | Status | Notes |
|---|---|---|
| Review request campaigns | Planned P16 | Workflow action `send_review_request` |
| SMS/email review requests | Planned P16 | Reuses email/SMS send paths |
| Review links | Planned P16 | Static Google review link per tenant/location |
| Google review link management | Planned P16 | Manual link storage; Google Business Profile API integration **Deferred** (requires Google API approval process, out of scope for MVP) |
| Review status tracking | Deferred | Requires the Google API integration above |
| Review widgets | Planned P16 (embeddable testimonial widget only) | |
| Testimonial collection | Planned P16 | Manual/form-based collection, not scraped |
| AI/manual review response | Deferred | Manual response tooling only; AI-drafted responses out of scope unless separately requested |
| Negative review escalation workflow | Planned P16 | Workflow trigger on manually-logged negative review |

## Payments, Invoices, and Proposals

| Feature | Status | Notes |
|---|---|---|
| Products/services | Planned P17 | |
| Estimates/proposals | Planned P17 | |
| Invoices | Planned P17 | |
| Payment links | Live P17 | Stripe Payment Links + text-to-pay SMS |
| Stripe integration | Live P17 | `packages/stripe`, mock mode default |
| Text-to-pay | Live P17 | SMS with payment link via `sendSms` on create |
| Paid appointments | Deferred | Depends on both P16 and P17 maturing first |
| Order forms | Deferred | Funnel + payment combination, later iteration |
| Upsells/downsells | Not planned (near-term) | E-commerce-shaped feature, out of scope for CRM/agency MVP |
| Payment status automation | Planned P17 | Workflow trigger `invoice.paid` |

## Agency / SaaS Layer

| Feature | Status | Notes |
|---|---|---|
| Super admin | Planned P18 | Platform-level, cross-tenant |
| Agency admin | Live P18 | Tenant with `type = agency` |
| Tenant/business account | Live | Existing `Tenant` (`direct` or `sub_account`) |
| Sub-account/client workspace | Live P18 | `Tenant.parentTenantId` |
| Team members | Live | `TenantMembership` |
| Roles and permissions | Live | Extended with `agency:*` permissions (P18) |
| White-label settings | Live P18 | `white_label_config` on agency tenant |
| Branding | Live P18 | Logo/color/product name override |
| Domain settings | Deferred | Custom domain routing (infra concern) |
| Billing plans | Live P18 | Global `billing_plans` catalog |
| Usage-based billing | Live P18 | Agency rollup on `usage_records` |
| Email/SMS/phone rebilling | Partial P18 | `billed_micros` column; markup math deferred |
| Feature flags | Live P18 | Tenant → plan → global fallback |
| Audit logs | Live | Agency elevation view at `/api/audit/agency` (P18) |
| Tenant isolation | Live | Two-level hierarchy (P18) |
| Per-tenant SendGrid/Twilio settings | Live | `TenantSendgridSettings`, `TenantTwilioSettings` |
| Global provider creds + tenant subaccount mapping | Live | ADR-0001 (SendGrid), ADR-0007 (Twilio) |
