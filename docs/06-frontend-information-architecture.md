# 06 — Frontend Information Architecture

## Conventions carried forward

Next.js App Router, `(authed)` route group with server-side
`getCurrentUser()` gate (redirect to `/login` if absent), EnXi design system
CSS variables, manager-component pattern (one `*-manager.tsx` client
component per resource driving CRUD via `lib/client-api.ts`), permission-aware
nav dimming (`can(permission)` checked against `user.permissions`). One
addition recommended for this expansion (see `03-system-architecture.md` §8):
introduce TanStack Query at the start of Phase 12 for new screens — existing
screens are not required to migrate, but every new manager component should
use it rather than hand-rolled `useState`+`fetch`, to avoid the inbox and
workflow-run screens (which need polling/near-real-time updates) each
reinventing cache/refetch logic.

Every nav item below must point to a real page before it ships — no
placeholder routes. If a phase ships the API before the UI, the nav item
stays hidden (not present, not disabled) until the page exists, per the
"no fake buttons" rule.

## Navigation map (target state, after all phases)

```
Workspace     Overview · Launchpad · Users · Audit log · Settings
Send          Senders · Domains · Transactional send · Events log · Email templates
Audience      Contacts · Companies · Lists · Segments · Suppressions · Tags
Sales         Pipelines · Deals · Tasks
Conversations Inbox (unified) · Phone numbers · Calls
Programs      Campaigns (email + SMS) · Workflows · Calendar · Appointments
Capture       Forms · Funnels & pages
Reputation    Reputation
Money         Invoices · Payment links
Insights      Analytics · Usage & billing
Agency        Sub-accounts · Branding · Billing plans · Feature flags   (agency tenants only)
```

Mapping notes against the brief's required section list: **Team** = the
existing Users screen; **Reporting** = the existing Analytics screen;
**Billing** = Usage & billing (tenant view) + Agency › Billing plans
(agency view); **Integrations** = deliberately not one screen — provider
setup lives where it's used (Senders/Domains for SendGrid, Phone numbers
for Twilio, Invoices for Stripe connection status), which avoids a
junk-drawer settings page; if a consolidated integrations overview is
wanted later it's a read-only rollup of those screens' statuses, not new
backend. **SMS campaigns** = the unified Campaigns screen with a channel
dimension (see its spec below), not a separate parallel module.

## Existing screens (19 routes — unchanged, full detail in `00-current-state-audit.md` §6)

Dashboard, Users, Audit log, Settings, Senders, Domains, Messages (renamed in
nav copy to "Transactional send" — no route change), Events, Templates,
Contacts, Lists, Segments, Suppressions, Campaigns, Automations (UI retained
read-only during the workflow-engine migration, then removed — see
`09-workflow-engine.md`), Inbox (superseded by the unified Conversations
inbox in Phase 14 — old `/inbox` route redirects to `/conversations`
post-migration, not left as a dead route), Analytics, Usage.

## New screens

### `/companies` — Phase 12
- Purpose: list + manage companies, drill into linked contacts.
- Components: `companies-manager.tsx` (list/create/edit), reuses `.data-table`.
- Data: `GET /api/companies`.
- Empty state: "No companies yet — add one or import contacts with a company field."
- Permissions: `companies:read`/`write`/`delete`.
- Actions: create, edit, delete, view linked contacts.

### `/companies/[id]` — Phase 12
- Purpose: company detail — contacts, deals, notes, tasks.
- Components: `company-detail.tsx`, `notes-panel.tsx` (shared with contact/deal detail), `tasks-panel.tsx` (shared).
- Data: `GET /api/companies/:id`, `GET /api/deals?companyId=`, `GET /api/notes?entityType=company&entityId=`.
- Permissions: `companies:read` (+ `deals:read`, `notes:read` for those panels — panel hides if permission missing, not an error state).

### `/contacts/[id]` — Phase 12 (contact detail page; today contacts are list-only)
- Purpose: single-contact hub — profile, tags, custom fields, timeline, tasks, notes, upcoming appointments, deals.
- Components: `contact-header.tsx`, `contact-timeline.tsx` (shared aggregation component, reused on deal detail), `tags-editor.tsx`, `tasks-panel.tsx`, `notes-panel.tsx`.
- Data: `GET /api/contacts/:id`, `GET /api/contacts/:id/timeline` (cursor-paginated — infinite scroll, loading skeleton per page).
- Empty state (timeline): "No activity yet."
- Error state: 404 → "Contact not found or you don't have access" (never distinguish the two, per tenant-isolation convention).
- Permissions: `contacts:read`; edit actions gated by `contacts:write`.

### `/pipelines` — Phase 12
- Purpose: Kanban board per pipeline, drag-and-drop stage moves.
- Components: `pipeline-board.tsx`, `deal-card.tsx`, `pipeline-switcher.tsx` (multiple pipelines), `stage-editor.tsx` (rename/reorder/add stage — modal).
- Data: `GET /api/pipelines`, `GET /api/deals?pipelineId=`.
- Loading state: skeleton columns.
- Actions: drag deal to new stage (`POST /api/deals/:id/move`), create deal, edit stage config.
- Permissions: `deals:read`/`write`, `pipelines:write` for stage editing.

### `/deals/[id]` — Phase 12
- Purpose: deal detail — value, stage history (via timeline), linked contact/company, tasks, notes.
- Reuses `contact-timeline.tsx` component scoped to `entityType=deal`.
- Permissions: `deals:read`/`write`.

### `/tasks` — Phase 12
- Purpose: cross-entity task list (my tasks / all tasks), due-date sorted.
- Components: `tasks-manager.tsx` — filter by assignee/status/due date.
- Empty state: "No open tasks."
- Permissions: `tasks:read`/`write`.

### `/deals` — Phase 12
- Purpose: flat, filterable deal list (complement to the Kanban board —
  sortable by value/close date/owner, filter by pipeline/stage/status;
  the board is for working a pipeline, the list is for querying deals).
- Components: `deals-list.tsx` (reuses `.data-table`), shares the
  create-deal modal with `pipeline-board.tsx`.
- Data: `GET /api/deals` with filters.
- Empty state: "No deals yet — create one here or from a pipeline board."
- Permissions: `deals:read`/`write`.

### `/tags` — Phase 12
- Purpose: manage the tenant's tag vocabulary (rename, recolor, delete,
  see per-tag contact counts); tagging *contacts* happens inline on the
  contact detail page, not here.
- Components: `tags-manager.tsx`.
- Data: `GET /api/tags` (list + counts).
- Empty state: "No tags yet — create your first tag."
- Permissions: `tags:read`/`write`/`delete`; deleting a tag in use shows a
  confirm dialog with the affected-contact count.

### `/launchpad` — Phase 12 (grows per phase)
- Purpose: setup checklist that walks a new tenant to a working account —
  each item deep-links to the real screen and shows live done/not-done
  state (verify a sender → `/senders`; authenticate a domain →
  `/domains`; import contacts → `/contacts`; create a pipeline →
  `/pipelines`; later phases append items: buy a number (P13), connect a
  calendar (P16), connect Stripe (P17)).
- Components: `launchpad-checklist.tsx` — item registry keyed by phase
  availability; items for modules that don't exist yet are absent, not
  greyed out (same "no placeholder promises" rule as the nav).
- Data: computed from existing per-module status endpoints; no new
  backend beyond a small `GET /api/launchpad/status` aggregator.
- Permissions: none beyond login (read-only rollup; each linked action is
  gated by its own screen's permissions).

### `/campaigns` — extended in Phase 13 (existing screen, new channel dimension)
- Purpose: the existing email campaigns screen gains a channel dimension
  when SMS campaigns land (P13): a channel selector on create
  (email | sms), a channel column/filter on the list, and channel-
  appropriate stats (opens/clicks for email; delivered/failed/opt-outs for
  SMS). One screen, one `campaigns` table (with a `channel` column added
  in P13 — `04-database-schema.md`), not a parallel SMS-campaigns module.
- SMS sends from a campaign enforce the same opt-in/opt-out gates as
  one-off SMS (`08-twilio-integration.md`) — enforced server-side at
  queue time, not just hidden in the UI.

### `/conversations` — Phase 14 (replaces `/inbox`)
- Purpose: unified inbox — channel-filterable thread list + message pane.
- Components: `conversation-list.tsx` (left pane, filter chips: All/Email/SMS/Voice), `conversation-thread.tsx` (right pane, message bubbles per channel with distinct styling), `contact-sidebar.tsx` (profile + quick actions), `quick-reply-box.tsx` (channel-aware — shows SMS char-count when channel=sms).
- Data: `GET /api/conversations` (polled or TanStack Query with refetch interval — no websocket in this phase, see open questions), `GET /api/conversations/:id/messages`.
- Empty state: "No conversations yet."
- Error state: channel-not-configured banner if a tenant has no SendGrid sender or Twilio number set up yet, linking to `/senders`/`/phone-numbers`.
- Permissions: `conversations:read`/`write`; assignment requires `conversations:write`.
- Actions: reply, assign, mark read, add internal note, filter by channel.

### `/phone-numbers` — Phase 13
- Purpose: search + purchase Twilio numbers, assign to users.
- Components: `phone-numbers-manager.tsx`, `number-search-modal.tsx` (area code search).
- Permissions: `phone-numbers:read`/`write`/`delete`.
- Actions: search, buy, assign, release (confirm dialog — irreversible).

### `/calls` — Phase 13
- Purpose: call log, recordings, dispositions.
- Components: `calls-manager.tsx`, `call-player.tsx` (recording playback, consent notice per `16-security-compliance.md`).
- Permissions: `calls:read`/`write`.

### `/workflows` — Phase 15
- Purpose: workflow list, draft/published state, run history.
- Components: `workflows-manager.tsx` (list), `workflow-builder.tsx` (node-graph editor — trigger node + action nodes with drag-connect; can start as a structured step-list editor like the existing automations UI and grow into a graph editor later, see `09-workflow-engine.md` for the phased UI approach), `workflow-run-log.tsx`.
- Data: `GET /api/workflows`, `GET /api/workflows/:id/runs`.
- Empty state: "No workflows yet — start from a template or blank."
- Permissions: `workflows:read`/`write`/`publish`.
- Actions: create, edit draft, publish, pause/resume, test-run, inspect run steps.

### `/calendar` — Phase 16
- Purpose: manage calendars, availability, booking link.
- Components: `calendars-manager.tsx`, `availability-editor.tsx` (weekly grid), `booking-link-card.tsx` (copyable public URL).
- Permissions: `calendar:read`/`write`.

### `/appointments` — Phase 16
- Purpose: appointment list/calendar view, reschedule/cancel/no-show.
- Components: `appointments-manager.tsx`, `appointment-detail-drawer.tsx`.
- Permissions: `appointments:read`/`write`.

### `/book/[slug]` — Phase 16 (public, no `(authed)` wrapper)
- Purpose: public booking page.
- Components: `public-booking-flow.tsx` (slot picker → contact info form → confirmation).
- Data: `GET /api/calendar/:slug/public-slots`, `POST /api/appointments`.
- Error state: invalid/inactive slug → simple "This booking link is no longer available" page, not a raw 404.
- No auth, no nav shell — deliberately outside the EnXi app-shell, minimal branded page.

### `/forms` — Phase 16
- Purpose: form builder (field list, ordering), embed snippet.
- Components: `forms-manager.tsx`, `form-field-editor.tsx`, `embed-snippet-modal.tsx`.
- Permissions: `forms:read`/`write`.

### `/funnels` — Phase 16
- Purpose: funnel step list, structured landing page section editor (not drag-and-drop visual builder — see `02-feature-matrix-ghl-style.md`).
- Components: `funnels-manager.tsx`, `page-section-editor.tsx` (structured JSON-schema sections: hero, form embed, testimonial, CTA).
- Permissions: `funnels:read`/`write`.

### `/f/[slug]` — Phase 16 (public)
- Purpose: rendered landing/funnel page.
- No auth, no app shell.

### `/reputation` — Phase 16
- Purpose: review request sends, Google review link config, widget embed.
- Components: `reputation-manager.tsx`, `widget-embed-modal.tsx`.
- Permissions: `reputation:read`/`write`.

### `/invoices` and `/payment-links` — Phase 17
- Purpose: invoice CRUD + send, standalone payment links.
- Components: `invoices-manager.tsx`, `payment-links-manager.tsx`.
- Permissions: `billing:read`/`write`.

### `/agency/sub-accounts` — Phase 18 (agency tenants only; hidden entirely for `type=direct` tenants)
- Purpose: list/create sub-accounts, "act as" elevation entry point.
- Components: `sub-accounts-manager.tsx`, `act-as-banner.tsx` (persistent banner shown platform-wide while elevated, with a one-click "return to agency view" — this is a hard requirement, not optional, per `15-saas-multitenancy-rbac.md`).
- Permissions: agency-admin role only.

### `/agency/branding`, `/agency/billing-plans`, `/agency/feature-flags` — Phase 18
- Standard CRUD managers, agency-admin only.

## Empty/loading/error state policy (applies to every screen above)

- **Empty**: always a specific, actionable sentence (never a bare "No data").
- **Loading**: skeleton matching the target layout (table row skeletons for
  lists, card skeletons for detail panes) — no full-page spinners once a
  layout shell is known.
- **Error**: distinguish "you don't have access" (permission-gated card,
  matches existing dimmed-nav pattern) from "something went wrong" (retry
  affordance) from "not found" (404 copy, tenant-isolation-safe wording).

## Explicit non-goals for this IA

No mobile app, no native shell — responsive web only. No websocket-based
live updates in the first pass of Conversations/Workflows (polling via
TanStack Query refetch intervals is acceptable for MVP; revisit as an open
question if inbox latency complaints arise post-launch).
