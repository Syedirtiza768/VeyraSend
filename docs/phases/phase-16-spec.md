# Phase 16 — Calendar, Forms, Funnels, Reputation

Status: **complete** · Gate: see §4 · Depends on Phases 12, 15 (complete)

## 1. Goal

Ship booking calendars with public slots, lead-capture forms with UTM attribution, structured landing pages/funnels, and link-based review requests — each with public endpoints, workflow triggers where specified, and minimal admin UI.

## 2. Scope

In scope: 10 tables (`calendars`, `appointments`, `forms`, `form_fields`, `form_submissions`, `landing_pages`, `funnels`, `funnel_steps`, `reputation_settings`, `review_requests`); calendar/appointments/forms/funnels/reputation API modules; public routes with IP rate limiting; triggers `appointment.booked`, `form.submitted`; authed pages + public `/book/[slug]` and `/f/[slug]`.

Out of scope: Google Calendar OAuth/sync (design only); visual drag-and-drop page builder; CAPTCHA; custom domains; embed script assets; appointment reminder hardcoding (use workflows).

## 3. Acceptance gate

1. Public booking link returns slots and creates an appointment + contact.
2. Form submission upserts contact with first-touch UTM; honeypot spam logged not discarded.
3. Unpublished landing page returns `available: false` (not raw 404).
4. Review request sends (email) and tracked redirect marks `clicked`.
5. Tests pass (`phase-16.spec.ts`).

## 4. Deliverables

| Area | Artifact |
|---|---|
| DB | `1700000016000-Phase16CalendarFormsReputation.ts`, `1700000016001-BackfillPhase16Permissions.ts` |
| API | `calendar/`, `forms/`, `funnels/`, `reputation/` modules |
| Triggers | `appointment.booked`, `form.submitted` in workflow registry |
| UI | `/calendar`, `/appointments`, `/forms`, `/funnels`, `/reputation`, `/book/[slug]`, `/f/[slug]` |
| Tests | `apps/api/test/phase-16.spec.ts` |
