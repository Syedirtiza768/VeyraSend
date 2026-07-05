# Frontend / Backend Sync (Live)

> Last verified: **2026-07-05**

## Route ↔ API mapping

All sidebar links resolve to real pages. Permission-gated items render as dimmed non-links when the user lacks access.

| Frontend route | Page file | Primary API endpoints | Manager component |
|---|---|---|---|
| `/dashboard` | `(authed)/dashboard/page.tsx` | `GET /api/auth/me` | inline only |
| `/users` | `(authed)/users/page.tsx` | `/api/users`, `/api/users/roles` | `users-manager.tsx` |
| `/audit` | `(authed)/audit/page.tsx` | `GET /api/audit?limit=100` | inline table |
| `/settings` | `(authed)/settings/page.tsx` | `GET/PUT /api/settings` | `settings-manager.tsx` |
| `/senders` | `(authed)/senders/page.tsx` | `/api/sendgrid/status`, `/api/senders` | `senders-manager.tsx` |
| `/domains` | `(authed)/domains/page.tsx` | `/api/sendgrid/status`, `/api/domains` | `domains-manager.tsx` |
| `/messages` | `(authed)/messages/page.tsx` | `/api/messages`, `/api/sendgrid/status` | `messages-manager.tsx` |
| `/phone-numbers` | `(authed)/phone-numbers/page.tsx` | `/api/phone-numbers`, `/api/twilio/provision` | `phone-numbers-manager.tsx` |
| `/calls` | `(authed)/calls/page.tsx` | `/api/calls` | `calls-manager.tsx` |
| `/events` | `(authed)/events/page.tsx` | `GET /api/events` | inline table |
| `/templates` | `(authed)/templates/page.tsx` | `/api/templates` (+ preview, test-send) | `templates-manager.tsx` |
| `/contacts` | `(authed)/contacts/page.tsx` | `/api/contacts` (+ import) | `contacts-manager.tsx` |
| `/contacts/[id]` | `(authed)/contacts/[id]/page.tsx` | `/api/contacts/:id`, `/timeline`, `/tags` | `contact-detail.tsx` |
| `/companies` | `(authed)/companies/page.tsx` | `/api/companies` | `companies-manager.tsx` |
| `/companies/[id]` | `(authed)/companies/[id]/page.tsx` | `/api/companies/:id` | `entity-panels.tsx` |
| `/lists` | `(authed)/lists/page.tsx` | `GET/POST/DELETE /api/lists` | `lists-manager.tsx` |
| `/segments` | `(authed)/segments/page.tsx` | `/api/segments` (+ evaluate) | `segments-manager.tsx` |
| `/suppressions` | `(authed)/suppressions/page.tsx` | `/api/suppressions` | `suppressions-manager.tsx` |
| `/pipelines` | `(authed)/pipelines/page.tsx` | `/api/pipelines`, `/api/deals` | `pipeline-board.tsx` |
| `/deals/[id]` | `(authed)/deals/[id]/page.tsx` | `/api/deals/:id` | `entity-panels.tsx` |
| `/tasks` | `(authed)/tasks/page.tsx` | `/api/tasks` | `tasks-manager.tsx` |
| `/campaigns` | `(authed)/campaigns/page.tsx` | `/api/campaigns`, `/api/templates`, `/api/segments` | `campaigns-manager.tsx` |
| `/automations` | `(authed)/automations/page.tsx` | `/api/automations` | `automations-manager.tsx` |
| `/conversations` | `(authed)/conversations/page.tsx` | `/api/conversations` (+ messages, notes, read) | `conversations-manager.tsx` |
| `/inbox` | `(authed)/inbox/page.tsx` | redirects → `/conversations` | — |
| `/analytics` | `(authed)/analytics/page.tsx` | `/api/analytics/overview`, `/api/analytics/timeseries` | `dashboard.tsx` |
| `/usage` | `(authed)/usage/page.tsx` | `GET /api/usage` | inline tiles |
| `/login` | `login/page.tsx` | `POST /api/auth/login` | inline form |
| `/` | `page.tsx` | — | redirects to `/dashboard` or `/login` |
| `/health` | `health/route.ts` | — | web health probe |

## Sidebar navigation

Defined in `apps/web/app/(authed)/layout.tsx`:

| Group | Items | Required permission (representative) |
|---|---|---|
| Workspace | Overview, Users, Audit log, Settings | varies |
| Send | Senders, Domains, Transactional send, Phone numbers, Calls, Events log, Templates | `senders:read`, `phone-numbers:read`, etc. |
| Audience | Contacts, Companies, Lists, Segments, Suppressions | `contacts:read`, `companies:read`, etc. |
| Sales | Pipelines, Tasks | `deals:read`, `tasks:read` |
| Programs | Campaigns, Automations, Conversations | `campaigns:read`, `conversations:read` |
| Insights | Analytics, Usage & billing | `analytics:read`, `usage:read` |

**Verdict:** No broken sidebar links. All nav items map to existing routes.

## API endpoints without UI

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/install` | Intentional | Bootstrap only |
| `POST /api/sendgrid/provision` | Wired | From Senders/Domains managers |
| `POST /api/twilio/provision` | Wired | From Phone numbers manager |
| `POST /api/sms/send` | **Gap** | API only — no compose-SMS UI (conversations reply covers SMS partially) |
| `GET/POST/DELETE /api/lists/:id/members` | **Gap** | API exists; no list member UI |
| `GET/POST /api/tags`, custom-fields CRUD | **Gap** | API only; no admin pages |
| `GET /api/messages/:id` | Minor gap | List view only |
| `GET /api/campaigns/:id` | Minor gap | No `/campaigns/[id]` route |
| `GET /api/automations/:id/enrollments` | Minor gap | Not in automations UI |
| `GET /api/inbound/threads` | Legacy | Superseded by conversations |
| `users:delete`, `tenants:write` | N/A | Permissions defined; no routes |

## UI without full backend (misleading labels)

| UI element | Issue |
|---|---|
| `/usage` sidebar label "Usage & billing" | Billing is **Planned** — page shows inventory counts only |
| `/dashboard` Phase 1 copy | References future phases for features that already exist |
| `/dashboard` permissions table | Lists only 6 permissions; app uses 67 |

## Frontend patterns

- **Server fetch:** `serverApi()` in page components for initial SSR data.
- **Client mutations:** `api()` in `*-manager.tsx` components with CSRF.
- **Detail routes:** `/contacts/[id]`, `/companies/[id]`, `/deals/[id]` use TanStack Query.
- **Permission denied:** Pages show message when user lacks required permission.

## Backend capabilities without frontend exposure

| Capability | Backend | Frontend |
|---|---|---|
| List member add/remove | Live API | **Missing UI** |
| Tag attach (standalone) | Live API | Partial — read-only on contact detail |
| Custom field values | Live API | **Missing UI** |
| SMS send (standalone) | Live API | Reply via conversations only |
| Outbound call dial | Live API | **Missing UI** (calls list only) |
| Automation enrollments | Live API | Not displayed |

## Mismatches summary

| Type | Item | Severity |
|---|---|---|
| UI gap | List member management | Medium |
| UI gap | Tags attach, custom fields | Medium |
| UI gap | Outbound call dial, standalone SMS | Low |
| Stale content | Dashboard phase copy | Low — cosmetic |
| Misleading label | "Usage & billing" | Low |
| Planned | Workflows, calendar, billing | N/A — Phase 15+ |

## Verification checklist

When adding a new feature, verify:

1. New API route has a page or is intentionally headless (webhook, cron).
2. Sidebar entry added with correct permission.
3. `*-manager.tsx` created if mutations needed.
4. This file updated with route ↔ API row.
5. `docs/system-context.md` module list updated.
