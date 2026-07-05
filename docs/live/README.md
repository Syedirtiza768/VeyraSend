# Live Documentation Index

> **Start at [`docs/system-context.md`](../system-context.md)** — the single source of truth for AI agents and developers.

This directory contains **live** documentation that reflects what is actually implemented in the codebase today. It is updated whenever code changes.

**Phases complete in code:** 0–14 (email platform, CRM, Twilio, unified conversations).

## Files

| Doc | Purpose |
|---|---|
| [DOCUMENTATION_RULES.md](./DOCUMENTATION_RULES.md) | How to write and maintain live docs |
| [01-system-overview.md](./01-system-overview.md) | Purpose, modules, roles, architecture, stack |
| [02-features.md](./02-features.md) | Every live/partial feature with flows and rules |
| [03-technical-reference.md](./03-technical-reference.md) | Auth, validation, errors, jobs, debt |
| [04-api-reference.md](./04-api-reference.md) | All HTTP endpoints |
| [05-database.md](./05-database.md) | Entities, migrations, RLS, seed |
| [06-frontend-backend-sync.md](./06-frontend-backend-sync.md) | Route ↔ API mapping, gaps |
| [CHANGELOG.md](./CHANGELOG.md) | Chronological change log |

## Planning docs (not live state)

These describe the full GHL-style vision and future phases. Do **not** treat them as current implementation without checking `system-context.md`:

- `docs/00-current-state-audit.md` — **stale snapshot** (pre-Phase 12); superseded by this live layer
- `docs/01-product-vision.md` through `docs/22-open-questions-and-decisions.md`
- `docs/18-implementation-roadmap.md` — Phase 15+ roadmap
- `docs/phases/phase-{12,13,14}-spec.md` — completed phase specs; Phase 15+ when started

## Architecture decisions (ratified, still valid)

- `docs/decisions/0001` through `0007`

## For AI coding agents

1. Read `docs/system-context.md` before any change.
2. After completing changes, update `system-context.md` + affected live doc(s) + `CHANGELOG.md`.
3. Follow `DOCUMENTATION_RULES.md`.
