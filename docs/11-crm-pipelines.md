# 11 — CRM & Pipelines

Schema: `04-database-schema.md` §2. API: `05-api-design.md` §companies/
contacts/pipelines/deals/tasks/notes. This doc covers the business rules
that don't fit in a schema/route table.

## Contact as the spine (restated from `03-system-architecture.md`)

Every new module resolves to a `Contact` before doing anything else. Two
resolution keys exist post-expansion: `email` (existing, unique per
tenant) and `phone` (new). Resolution order when both are available (e.g.,
a form submission with both fields): try `email` match first (it's been the
stable key since Phase 4), fall back to `phone`, create new if neither
matches. If a phone-only inbound signal (SMS) and later an email-only
signal both arrive for what's actually the same person with no shared
identifier, they remain two separate contacts — **this is the
duplicate-detection gap**, documented honestly as "Deferred" in
`02-feature-matrix-ghl-style.md` rather than silently merged (silent
merging is worse than a visible duplicate).

## Companies

One company has many contacts (`contacts.company_id`); a contact has at
most one company (no many-to-many — if a contact genuinely works with two
companies, that's an edge case handled by leaving `company_id` pointing at
the primary one and noting the other in a `Note`, not by modeling
many-to-many for a rare case). Deleting a company does not cascade-delete
its contacts (`ON DELETE SET NULL` on `contacts.company_id`, not `CASCADE`)
— losing a company record must never silently delete contact history.

## Pipelines & stages

- A tenant can have multiple pipelines (e.g., "Sales" and "Onboarding").
- Stage reordering is a full-replace operation (`PATCH /api/pipelines/:id/stages`)
  specifically so reordering many stages at once is atomic — no
  intermediate invalid state where two stages briefly share a `position`.
- A stage flagged `is_won` or `is_lost` is a terminal stage: moving a deal
  into it sets `deals.status` accordingly and stops it from appearing in
  active-pipeline views by default (still queryable via `status` filter).
- Deleting a pipeline/stage that still has non-deleted deals is blocked
  (`409`) — the caller must move or delete those deals first. This is a
  deliberate guardrail against silently orphaning deal data.

## Deals

- `move` (stage change) is a distinct endpoint from generic field `PATCH`
  specifically because it's a workflow trigger source and an audited event
  in its own right — folding it into generic PATCH would make "did the
  stage change" ambiguous to detect reliably from an audit log entry.
- `valueCents`/`currency`: stored as integer cents, never floating point.
  Multi-currency rollup reporting (converting between currencies for
  agency-level totals) is **out of scope** for this phase — report per
  currency, don't silently sum mixed currencies.

## Tasks & notes

- Polymorphic via `(entity_type, entity_id)` rather than three separate
  join tables (`contact_tasks`, `deal_tasks`, `company_tasks`) — chosen
  because task list UI ("my tasks across everything") needs one query
  surface, and three tables would require a UNION anyway. Tradeoff
  documented in `04-database-schema.md`: no DB-level FK integrity on the
  polymorphic pointer, enforced at the service layer instead. Test this
  enforcement explicitly (`21-testing-strategy.md`) since it's the one
  place this schema trades safety for query simplicity.
- Notes are never edited once created (no `PATCH /api/notes/:id`) — a
  correction is a new note; this keeps the timeline an honest,
  append-only record of what was actually said/known at the time, which
  matters for CRM trust more than edit convenience.

## Tags

- Tenant-scoped vocabulary, not global — "VIP" in Tenant A and "VIP" in
  Tenant B are unrelated rows, consistent with every other tenant-scoped
  table.
- Tag add/remove are both workflow triggers (`tag.added`) and audited
  events, same treatment as deal stage moves.

## Custom fields

- Two coexisting mechanisms during the transition (see
  `04-database-schema.md` §2 and `22-open-questions-and-decisions.md`):
  the existing `contacts.custom_fields jsonb` (Phase 4-era, ad hoc, no
  tenant-defined schema) and the new `custom_fields`/`custom_field_values`
  (Phase 12, tenant-defined field catalog with typed values). New UI reads
  from the new mechanism; the old jsonb column is read-only-compat for
  existing data until a decision is made on backfilling it (open question,
  not resolved silently here).

## Lead source & lifecycle stage

- `leadSource` is a free-text field populated primarily by forms/funnels
  (`13-forms-funnels-pages.md`) via UTM capture, secondarily set manually.
- `lifecycleStage` (`lead`|`mql`|`sql`|`customer`|`other`) is a flat enum,
  not a second pipeline — it's a coarse marketing/sales handoff signal,
  while `Deal`+`PipelineStage` carries the actual sales-process detail.
  Don't conflate the two: a contact's lifecycle stage doesn't move just
  because a deal moved stages — that mapping, if wanted, is a workflow
  rule a tenant configures (`update_field` action on a `pipeline_stage.changed`
  trigger), not a hardcoded coupling.

## Import/export

- CSV import already exists for contacts (Phase 4); extend the same
  importer to accept `company` (resolved/created by name+domain match) and
  `tags` (comma-separated, resolved/created) columns in Phase 12, rather
  than building a separate companies importer.
- Export (`POST /api/contacts/export`) is new — see `05-api-design.md`.
  Large exports (>5k rows) run as an async job; the UI polls or receives a
  signed download-link response once ready, matching the async pattern
  already used nowhere else in this codebase today, so this is the first
  precedent for "long-running request → async job → poll for result" —
  document that pattern once here for reuse by later export-shaped
  features (e.g., a future workflow-run export) rather than reinventing it.

## Duplicate detection

Exact-email-uniqueness (existing) is the only dedup mechanism. Fuzzy
matching (name similarity, phone normalization across formats) is
**Deferred** per the feature matrix — flag it honestly in the UI
(`GET /api/contacts/duplicates` returns only exact secondary matches, e.g.
same phone number across two contact rows with different emails) rather
than implying a fuzzy-match capability that doesn't exist.
