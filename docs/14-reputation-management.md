# 14 — Reputation Management

Schema: `04-database-schema.md` §8. API: `05-api-design.md` §reputation.

## Scope decision: link-based review requests, not a Google API integration

Per `02-feature-matrix-ghl-style.md`, deep Google Business Profile API
integration (pulling live review content/ratings, posting responses via
API) is **Deferred** — it requires a Google API approval/verification
process that's a separate undertaking from this build. What ships:

- Tenant stores a static **Google review link** (the standard
  `https://g.page/r/.../review` or Google Maps review-shortcut URL a
  business gets from their Google Business Profile — copy-pasted by the
  tenant, not fetched via API).
- A **review request** sends that link to a contact via email or SMS
  (reusing the existing send paths, no new provider integration).
- Tracking is limited to what the platform itself can observe: request
  sent, link clicked (via a redirect-tracking URL the platform generates
  before forwarding to the real Google link), and manually-logged outcome
  (a tenant can log "they left a review" or note a rating if the contact
  tells them directly). The platform does **not** know the actual review
  content or star rating automatically — say so plainly in the UI copy,
  don't imply automated review scraping.

## Review request flow

`POST /api/reputation/requests { contactId, channel }` → resolves the
tenant's configured review link → generates a short tracked redirect URL
(`review_requests.id` embedded) → sends via `mail`/`sms` queue → status
progresses `sent` → `clicked` (redirect hit) → `completed` (manual log).
This is a thin module: no new provider, no new queue, reuses existing send
infrastructure entirely.

## Triggering review requests

Typically fired from a workflow (`09-workflow-engine.md`) on
`appointment.booked`+completed, or manually from a contact's detail page —
not automatically fired from anything else in this phase (e.g., not
auto-triggered "N days after every completed deal" unless a tenant builds
that workflow themselves).

## Widgets

An embeddable testimonial widget (`<script>` embed, same pattern as the
forms embed) renders **manually collected testimonials** (a tenant
pastes/enters a quote + name, no automated review pull) — this is
explicitly a testimonial-display widget, not a live Google-reviews widget,
per the same honesty rule as above.

## Negative review escalation

Since there's no automated review-content ingestion, "negative review
escalation" is a **manually triggered** workflow: a tenant logs a negative
review outcome on a `review_requests` row (or directly on a contact), which
can fire a `manual`-type workflow trigger (e.g., notify a manager, create a
task) — same trigger/action vocabulary as everything else, no new
mechanism invented for this one case.

## AI/manual review response

AI-drafted review responses are **out of scope** unless separately
requested — this brief's task list names it, but building it means an LLM
integration entirely outside SendGrid/Twilio/Stripe, which is a different
kind of decision (model choice, cost, prompt design) that deserves its own
scoping conversation rather than being bundled into this phase silently.
Manual response is just a `note`/task workflow, already covered above.
