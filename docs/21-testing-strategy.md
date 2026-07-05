# 21 — Testing Strategy

## Existing baseline (keep this bar, don't lower it)

11 Jest/Supertest suites, one per phase plus a dedicated
`tenant-isolation.spec.ts` (per `00-current-state-audit.md` §"Test suites").
Every new phase in `18-implementation-roadmap.md` adds its own suite
following the same naming convention (`{phase-topic}.spec.ts`), not folded
into an existing file, so suites stay traceable to the phase that
introduced them — same discipline the existing 11 already follow.

## What every new suite must prove (non-negotiable, per-table)

For every new tenant-scoped table introduced in this expansion
(`04-database-schema.md`), the owning phase's test suite proves:

1. **Tenant isolation**: a user in Tenant A cannot read/write Tenant B's
   row of this table, via both the "list" endpoint (Tenant B's row
   absent) and the "get by id" endpoint (404, not 403 — existing
   convention). Mirrors `tenant-isolation.spec.ts`'s existing pattern;
   extend that file's fixtures rather than duplicating tenant/user setup
   boilerplate per suite.
2. **RBAC**: a role lacking the relevant permission gets `403` on the
   write/delete route; a role with only `:read` cannot reach `:write`
   routes.
3. **Migration reversibility**: `migration:revert` on the new migration
   succeeds cleanly against a DB that has the migration applied (run in CI
   as part of the migration test, not just eyeballed).

## Provider-integration test pattern (mock mode is a first-class test target, not a shortcut)

`packages/sendgrid`'s mock mode is already a tested code path, not just a
dev convenience — `packages/twilio` and `packages/stripe` must ship with
the same property: every queue worker, webhook handler, and send path has
a test that runs the **entire flow** in mock mode with no real provider
credentials, asserting on the mock's deterministic output. This is what
lets CI run the full suite without live SendGrid/Twilio/Stripe accounts —
preserve that property, it's why the existing suite is CI-runnable at all.

Additionally, for every new webhook (Twilio SMS/voice, Stripe):

- A test posting a **correctly signed** payload succeeds and produces the
  expected DB state.
- A test posting an **unsigned or tamper-signed** payload is rejected
  (`403`) and produces **no** DB state change — this is the regression
  test that would have caught the Inbound Parse gap
  (`00-current-state-audit.md` §9) had it existed from the start; write it
  for every new webhook without exception.
- A test posting a **duplicate** event (same dedup key twice) results in
  exactly one processed effect, not two (dedup test, mirrors
  `messages-events.spec.ts`'s existing `sg_event_id` dedup test).

## Workflow engine — specific risky-path tests (per `09-workflow-engine.md`)

- **Idempotent redelivery**: replaying the same `workflow-run` job id after
  its step already completed produces no duplicate side effect (no second
  email/SMS sent).
- **Delay durability**: a workflow paused at a delay step survives a
  simulated worker restart and resumes correctly at/after `run_at`.
- **Version pinning**: publishing a new workflow version mid-run does not
  alter the behavior of runs already in flight on the prior version.
- **Dry-run isolation**: `test-run` mode makes zero calls into
  `packages/sendgrid`/`packages/twilio`/outbound HTTP — assert via a
  call-count spy on the provider client, not just by reading logs.
- **Dead-end/failure state**: a permanently-failing action node marks the
  run `failed` and stops (no infinite retry loop, no silent success).

## Conversations — specific tests (per `10-conversations-inbox.md`)

- A reply sent via a different channel than the thread's last-used channel
  still attaches to the same `Conversation` (not a new one).
- Migrated `InboundThread`/`InboundMessage` row counts match pre-migration
  counts exactly (data-integrity test on the one-time migration script,
  run against a snapshot of representative existing data, not just an
  empty DB).

## Public/unauthenticated endpoint tests (booking, forms, funnels)

- Rate limiting actually triggers past the configured threshold (`429`),
  not just configured-and-untested.
- Honeypot-filled form submissions are rejected from creating a `Contact`
  but the raw `form_submissions` row is still stored (per
  `13-forms-funnels-pages.md`'s "never discard raw submissions" rule —
  test that specific behavior, it's easy to accidentally drop the row on
  the rejection path).
- Booking against a full/unavailable slot is rejected, not silently
  double-booked (concurrency test: two near-simultaneous booking requests
  for the same slot — only one should succeed).

## Agency/multi-tenancy tests (per `15-saas-multitenancy-rbac.md`)

- The **harder isolation case**: two sub-accounts under the same parent
  agency cannot see each other's data (not just "isolated from an
  unrelated tenant," which the existing pattern already covers — this is a
  new case worth its own explicit test).
- "Act as" elevation writes an audit log entry on both start and end, and
  a session that never explicitly elevated cannot access sub-account data
  through any route.
- Attempting to nest a sub-account under another sub-account is rejected
  (`400`).

## CI integration

**Verified: `pnpm test` is not in `.github/workflows/ci.yml`** — the
pipeline runs only `install → typecheck → lint → build`, so the 11 existing
suites do not gate merges today. Adding a test step (with Postgres + Redis
service containers, since the suites hit a real DB/Redis) is a Phase 12
day-one task, not a "someday" item.

## Manual/exploratory testing (frontend)

Per the top-level instruction to actually exercise UI changes in a browser:
every new screen in `06-frontend-information-architecture.md` gets a
manual pass through its golden path + declared empty/loading/error states
before a phase is marked complete — this is a phase-spec acceptance-gate
item (`18-implementation-roadmap.md`), not assumed from passing API tests
alone, consistent with this project's own stated principle that test
suites verify correctness of code, not of the feature as experienced.
