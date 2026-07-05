# 13 — Forms, Funnels & Pages

Schema: `04-database-schema.md` §7. API: `05-api-design.md` §forms/funnels.

## Scope decision: structured builder, not visual drag-and-drop

The brief asks for "basic page builder architecture." A full visual
drag-and-drop builder (freeform canvas, arbitrary component placement,
inline style editing) is a multi-month frontend investment on its own and
is explicitly **Deferred** per `02-feature-matrix-ghl-style.md`. What ships
instead: a **structured, section-based page model** — `landing_pages.content`
is a `jsonb` array of typed sections from a fixed catalog
(`hero`, `form_embed`, `testimonial`, `feature_grid`, `cta`, `text_block`,
`image`), each with a small config schema, rendered by a corresponding
React component in `apps/web`. Tenants pick sections, reorder them, and
fill in config (headline text, image URL, which form to embed) — no
freeform layout. This is honest, buildable, and still gets a tenant from
zero to a working lead-capture page without a developer, which is the
actual product goal; it is not a claim of a general website builder.

## Forms

- Field types: `text`, `email`, `phone`, `textarea`, `select`, `checkbox`,
  `date` — matches common CRM-field types so field mapping to
  `contacts`/`custom_fields` is direct (`form_fields.field_key` names either
  a built-in contact column or a `custom_fields.key`).
- Spam protection: honeypot field (hidden input real users never fill) +
  IP-based rate limit on `POST /api/forms/:id/submit`. CAPTCHA is
  **deferred** — adds a third-party dependency (reCAPTCHA/hCaptcha) and
  friction; add only if honeypot + rate-limit proves insufficient in
  practice.
- Every submission is stored in `form_submissions` **even if** it fails to
  map to/create a contact (e.g., malformed email) — the raw submission is
  never discarded, since losing a lead's raw form data because of a
  mapping error would be a worse failure mode than storing an
  unattributed submission for manual review.
- UTM capture: hidden fields (`utm_source`, `utm_medium`, `utm_campaign`,
  etc.) auto-populated client-side from the page's query string at render
  time, submitted alongside the visible fields, stored in
  `form_submissions.utm` and copied to `contacts.leadSource`/a UTM-specific
  jsonb field on first attribution (first-touch, not last-touch — document
  this choice; last-touch attribution is a different, equally valid model
  but the two must not be silently mixed).
- `form.submitted` is a registered workflow trigger.

## Funnels & landing pages

- A `landing_page` can exist standalone (its own `/f/:slug`) or as a step
  within a `funnel` (ordered via `funnel_steps.position`). A funnel's first
  step is typically a lead-capture page, later steps a thank-you/upsell
  page — but the platform doesn't enforce a specific step-type sequence;
  that's tenant judgment.
- Publishing (`landing_pages.published`) is a boolean gate — a page with
  `published=false` returns a "not available" response on the public route,
  same treatment as an invalid booking slug (`06-frontend-information-architecture.md`),
  never a raw 404 that looks like a broken platform link.
- No custom-domain-per-funnel in this phase (funnels live under the
  platform's own domain, `/f/:slug`); custom domains are covered by the
  agency white-label work (`15-saas-multitenancy-rbac.md`) and can extend
  to funnel pages later as a natural follow-on, not built twice.

## Embedded forms

A tenant can embed a form on their own external website via a small script
snippet (`<script src=".../embed/:formId.js">` that renders an iframe or a
lightweight injected form) — this only requires the existing public
`POST /api/forms/:id/submit` endpoint plus a thin embed script; no new
backend surface.

## What's explicitly not built

Surveys/quizzes (deferred — modeled as a `Form` variant with
branching-question logic later, not core to MVP expansion) and the visual
drag-and-drop builder (deferred, see above). Both are named in
`02-feature-matrix-ghl-style.md` so they're tracked, not silently dropped.
