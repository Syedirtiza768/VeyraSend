# Feature Documentation (Live)

> Status: **Live** · **Partial** · **Broken** · **Deprecated** · **Planned**
> Last verified: **2026-07-05**

## Authentication & tenancy

### Session login — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Browser session auth for all API routes |
| User flow | `/login` → `POST /api/auth/login` → redirect `/dashboard`; session cookie + CSRF token |
| Business rules | argon2id password verify; session stores `userId`, `tenantId`, `roleId`; session id rotates on login |
| Edge cases | Unauthenticated access to `(authed)` routes redirects to `/login` |
| Implementation | `apps/api/src/modules/auth/`, `apps/web/app/login/page.tsx` |

### One-time install — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Bootstrap first tenant + owner when no tenant exists |
| User flow | `POST /api/install` (public, one-time) |
| Implementation | `apps/api/src/modules/tenants/tenants.controller.ts` |

### RBAC — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Permission-gated API routes and sidebar nav |
| Business rules | `@Permissions()` requires at least one listed permission; member role is read-heavy |
| Implementation | `apps/api/src/common/guards/`, `apps/web/app/(authed)/layout.tsx` |

---

## SendGrid provisioning

### Subuser provisioning — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Per-tenant SendGrid subuser + encrypted API key |
| User flow | Senders/Domains pages → "Provision SendGrid" if not provisioned |
| Business rules | AES-256-GCM encrypted key at rest; mock mode when no parent API key (ADR-0001) |
| Implementation | `apps/api/src/modules/sendgrid/`, `packages/sendgrid/` |

### Sender verification — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Mirror SendGrid Single Sender Verification |
| User flow | `/senders` → create sender → resend verification email |
| API | `GET/POST/DELETE /api/senders`, `POST /api/senders/:id/resend-verification` |
| Implementation | `apps/web/components/senders-manager.tsx` |

### Domain authentication — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Mirror SendGrid domain auth (DKIM/SPF) |
| User flow | `/domains` → add domain → view DNS records → verify |
| API | `GET/POST/DELETE /api/domains`, `GET /api/domains/:id/dns`, `POST /api/domains/:id/verify` |
| Implementation | `apps/web/components/domains-manager.tsx` |

---

## Email send & events

### Transactional send — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Send one-off emails via BullMQ |
| User flow | `/messages` → compose → send |
| Business rules | Idempotency key per tenant; 6 retry attempts with exponential backoff; suppression check |
| Edge cases | Unprovisioned tenant blocked; suppressed contacts skipped |
| Implementation | `apps/api/src/modules/messages/`, `apps/api/src/modules/queue/` |

### Event webhook — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Ingest SendGrid delivery/engagement events |
| Business rules | ECDSA signature verification; dedup by `sg_event_id`; auto-suppression on bounce/complaint/unsubscribe |
| API | `POST /api/webhooks/events` (public, CSRF skipped) |
| Implementation | `apps/api/src/modules/webhooks/` |

### Events log — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Read raw `email_events` stream |
| User flow | `/events` table view |
| API | `GET /api/events` |

---

## Audience management

### Contacts — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Tenant-scoped contact records |
| User flow | `/contacts` → create, CSV import, delete |
| Business rules | Unique `(tenantId, email)`; status enum: active/unsubscribed/bounced/complained; `customFields` jsonb |
| Edge cases | Soft delete via `deletedAt` |
| API | `GET/POST/DELETE /api/contacts`, `POST /api/contacts/import` |
| Implementation | `apps/web/components/contacts-manager.tsx` |

### Lists — **Live** (API complete, UI partial)

| Aspect | Detail |
|---|---|
| Purpose | Static named contact groupings |
| User flow | `/lists` → create/delete list |
| **Partial** | No UI for add/remove list members; API exists: `GET/POST/DELETE /api/lists/:id/members` |
| Implementation | `apps/web/components/lists-manager.tsx` |

### Segments — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Rule-based dynamic contact sets |
| User flow | `/segments` → define rules → evaluate |
| Business rules | Definition stored as `{combinator, rules[]}` jsonb |
| API | `GET/POST/DELETE /api/segments`, `GET /api/segments/:id/evaluate` |

### Suppressions — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Block sends to bounced/complained/unsubscribed addresses |
| User flow | `/suppressions` → manual add/remove; also auto-populated from webhooks |
| API | `GET/POST/DELETE /api/suppressions` |

---

## Templates & campaigns

### Templates — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Versioned HTML/text templates with `{{variable}}` substitution |
| User flow | `/templates` → create → preview → test-send |
| Business rules | `TemplateVersion` history on update; generation modes: static/dynamic |
| API | Full CRUD + `/versions`, `/preview`, `/test-send` |

### Campaigns — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Broadcast email to a segment |
| User flow | `/campaigns` → create (template + segment) → send now or schedule → view stats |
| Business rules | States: draft → scheduled/active → completed/failed; 20s ticker fires due scheduled campaigns |
| API | `GET/POST/DELETE /api/campaigns`, `/send`, `/schedule`, `/stats` |

---

## Inbound / conversations

### Unified conversations — **Live**

| Aspect | Detail |
|---|---|
| Purpose | One thread per contact across email, SMS, and voice |
| User flow | `/conversations` → filter by channel → select thread → reply or add internal note |
| Business rules | `conversations` unique per `(tenantId, contactId)`; legacy `/inbox` redirects here |
| API | `GET/POST /api/conversations`, `/:id/messages`, `/:id/notes`, `/:id/read`, `/:id/assign` |
| Implementation | `conversations-manager.tsx`, `apps/api/src/modules/conversations/` |

### Inbound Parse — **Live** (legacy tables retained)

| Aspect | Detail |
|---|---|
| Purpose | Receive email replies via SendGrid Inbound Parse |
| **Hardened** | Optional `SENDGRID_INBOUND_PARSE_SECRET` query param |
| Legacy API | `GET /api/inbound/threads` still works; UI uses conversations |
| Implementation | `inbound.service.ts` also writes unified `messages` rows |

---

## CRM (Phase 12) — **Live**

Companies, pipelines/deals, tasks, notes, tags, custom fields API, contact detail + timeline at `/contacts/[id]`, `/companies`, `/pipelines`, `/tasks`. Tag attach and custom-field UI are **Partial**.

---

## Twilio SMS/voice (Phase 13) — **Live**

Phone numbers, SMS send/receive with STOP/START, call log, Twilio webhooks. Recordings/voicemail persistence and SMS campaigns are **Partial** or deferred.

---

## Explicitly not implemented (Planned — Phase 15+)

See `docs/02-feature-matrix-ghl-style.md` and `docs/18-implementation-roadmap.md`:

- Workflow engine (supersedes current automations)
- Calendar, forms, funnels, landing pages
- Reputation management
- Stripe payments, invoices
- Agency/sub-account layer, white-label, feature flags

---

## Automations — **Partial**

| Aspect | Detail |
|---|---|
| Purpose | Event-driven email sequences |
| **Live** | Trigger: `contact.created` only |
| **Live** | Actions wired: `send`, `delay`, `branch` |
| **Not wired** | Enum types in `packages/shared` but not implemented: triggers (`list_added`, `tag_added`, `form_submitted`, `email_opened`, etc.); actions (`tag`, `move_list`, `notify`, `stop`) |
| User flow | `/automations` → create definition JSON → toggle active/paused |
| Business rules | 20s ticker enrolls new contacts + advances due steps; enrollment FSM: active/completed/exited |
| Edge cases | Suppressed/non-active contacts skipped on send step; branch evaluates email/status/custom fields |
| Implementation | `apps/api/src/modules/automations/automations.service.ts`, `apps/web/components/automations-manager.tsx` |

---

## Analytics & admin

### Analytics — **Live**

| Aspect | Detail |
|---|---|
| Purpose | 30-day delivery/engagement overview + timeseries |
| User flow | `/analytics` dashboard tiles + chart |
| API | `GET /api/analytics/overview`, `GET /api/analytics/timeseries` |

### Settings — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Per-tenant webhook verification key override, retention days |
| User flow | `/settings` |
| API | `GET/PUT /api/settings` |

### Usage — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Inventory counts + this-month message/event volumes |
| User flow | `/usage` tile grid (labeled "Usage & billing" but billing is **Planned**) |
| API | `GET /api/usage` |

### Audit log — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Immutable record of state-changing actions |
| User flow | `/audit` (last 100 entries) |
| API | `GET /api/audit?limit=100` |

### Users — **Live**

| Aspect | Detail |
|---|---|
| Purpose | Invite/manage tenant users and assign roles |
| User flow | `/users` |
| API | `GET/POST/PATCH /api/users`, `GET /api/users/roles` |

### Data retention — **Live** (background)

| Aspect | Detail |
|---|---|
| Purpose | Delete old messages, events, inbound messages per tenant settings |
| Implementation | `apps/api/src/modules/retention/` — hourly ticker |

