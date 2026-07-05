# 12 — Calendar & Appointment Booking

Schema: `04-database-schema.md` §6. API: `05-api-design.md` §calendar/
appointments. This doc covers booking-flow business rules and the Google
Calendar integration boundary.

## Calendars

- A calendar is either **user-owned** (`owner_user_id` set — one person's
  availability) or a **team calendar** (`owner_user_id` null — round-robin
  across a configured member list, stored in `availability` config or a
  small `calendar_members` join if round-robin membership needs to differ
  from a fixed set — start with a `member_user_ids uuid[]` column on
  `calendars` rather than a new join table; promote to a join table only
  if per-member metadata, like weighting, is needed later).
- `availability jsonb` stores weekly recurring rules
  (`{ monday: [{start:'09:00', end:'17:00'}], ... }`) in the calendar's own
  `timezone`. Slot computation always converts to UTC internally and back
  to the requesting party's timezone for display — store instants in UTC,
  never store a wall-clock time without its zone.

## Booking link & public slot computation

- `booking_slug` is globally unique (not per-tenant-scoped in the URL path)
  since booking links are public URLs (`/book/:slug`) shared outside the
  authenticated app — slug uniqueness must be enforced platform-wide, and
  the slug alone (no tenant id in the URL) is what resolves the tenant
  server-side. This is one of the few places a public route derives tenant
  context from something other than the session — call this out explicitly
  since it's an exception to "tenant_id is never trusted from the request"
  (the exception is safe here because `booking_slug` is a server-generated,
  unguessable-enough identifier that only ever grants read access to public
  availability + the ability to create one appointment, not arbitrary
  tenant data).
- `GET /api/calendar/:slug/public-slots` computes free slots by subtracting
  existing `appointments` (for that calendar, in the requested range) from
  the weekly `availability` rules — computed on read, not materialized,
  since availability changes should reflect immediately.
- Slot granularity and buffer time (e.g., 15-min buffer between meetings)
  are calendar-level config fields, not hardcoded.

## Booking action

`POST /api/appointments` (public) resolves/creates a `Contact` by
`contactEmail`/`contactPhone` (same resolution order as
`11-crm-pipelines.md`), creates the `Appointment`, and — for a team
calendar — assigns `assigned_user_id` via round-robin (simplest fair
policy: least-recently-assigned member; store `last_assigned_at` per
member or just query the member's most recent appointment). Rate-limited
by IP (`16-security-compliance.md`) since it's an unauthenticated,
data-writing public endpoint.

## Reminders

Appointment reminders are **workflow actions**, not hardcoded scheduling
logic: booking an appointment enqueues (via the `reminder` queue, using
BullMQ's `delay` option) a `send_email`/`send_sms` action at
`startsAt - reminderOffset`. Default offsets (24h, 1h before) are seeded
per-tenant defaults, editable via a workflow so tenants can customize
timing/copy without code changes — this reuses the workflow engine's
`send_email`/`send_sms` actions rather than inventing a separate reminder
templating system.

## Reschedule / cancel / no-show

- Reschedule creates no new row — updates `starts_at`/`ends_at` on the
  existing `appointments` row and re-schedules the pending reminder jobs
  (cancel old delayed jobs by their known BullMQ job id, enqueue new ones).
- Cancel sets `status='cancelled'`; still visible in history (no delete).
- No-show is a manual action (`POST /api/appointments/:id/no-show`) — not
  auto-detected, since auto-detecting "no one showed up" isn't reliably
  knowable from calendar data alone without a video/call integration.

## Pipeline automation after booking

`appointment.booked` is a registered workflow trigger
(`09-workflow-engine.md`); moving a linked deal's stage on booking is a
tenant-configured workflow (`move_pipeline_stage` action), not hardcoded —
consistent with the CRM doc's rule against hardcoding pipeline-stage
coupling.

## Google Calendar integration — architecture only, not built this phase

Per the feature matrix, this is "Planned P16 (architecture only)":

- OAuth2 connection per **user** (not per tenant — each team member
  connects their own Google account), token stored encrypted
  (`google_calendar_connections(user_id, encrypted_refresh_token,
  calendar_id)` — new table, not shoehorned into `tenant_*_settings` since
  it's user-scoped, not tenant-scoped).
- Two-way sync direction: platform-created appointments push to the
  connected Google Calendar as events (prevents double-booking against a
  user's other Google meetings); a periodic pull job checks Google
  busy/free blocks and subtracts them from public-slot computation
  alongside `appointments`.
- This is explicitly **design-only** in this phase — implement the booking
  flow fully self-contained first (Phase 16), add the Google sync as a
  follow-on once the core booking flow is proven, per the roadmap.
