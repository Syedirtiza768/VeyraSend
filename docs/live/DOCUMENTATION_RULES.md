# Documentation Rules (Live Layer)

> These rules govern `docs/system-context.md` and everything under `docs/live/`.
> Read this before editing live documentation.

## Purpose

The **live documentation layer** reflects the **true current state** of VeyraSend as implemented in the repository. It is distinct from planning documents (`docs/01-*` through `docs/22-*`, `docs/phases/*`, `docs/18-implementation-roadmap.md`) which describe future expansion toward a GHL-style platform.

## Rules

1. **No aspirational documentation.** Only document behavior that exists in code today. If a feature is planned, mark it **Planned** and point to the planning doc — do not describe it as if it exists.

2. **Status labels.** Use exactly one of:
   - **Live** — implemented and reachable in the running app
   - **Partial** — some code exists but not fully wired (explain what works vs. what does not)
   - **Broken** — known defect with reference to issue or audit section
   - **Deprecated** — still present but superseded
   - **Planned** — designed but not in code

3. **Ground truth order.** When documents disagree, trust in this order:
   1. Source code (`apps/*`, `packages/*`)
   2. `docs/system-context.md` and `docs/live/*`
   3. `docs/00-current-state-audit.md`
   4. Planning docs (`docs/01-*` … `docs/22-*`)

4. **Update with code changes.** Any PR or task that changes features, modules, APIs, database schema, UI routes, configuration, integrations, or architecture must update:
   - `docs/system-context.md` (always)
   - Relevant `docs/live/*` file(s)
   - `docs/live/CHANGELOG.md` (append entry)

5. **Concise but complete.** Prefer tables and bullet lists over prose. Include file paths for key implementation locations.

6. **Cross-reference, don't duplicate.** Planning docs stay in `docs/`. Live docs link to them for future work; they do not copy planned API schemas.

7. **AI agent workflow.**
   - **Before changes:** read `docs/system-context.md`
   - **After changes:** update `docs/system-context.md` + affected live docs + CHANGELOG

## File map

| File | Contents |
|---|---|
| `docs/system-context.md` | Master context — start here |
| `docs/live/01-system-overview.md` | Purpose, modules, roles, architecture, stack |
| `docs/live/02-features.md` | Every live/partial feature with flows and rules |
| `docs/live/03-technical-reference.md` | Auth, validation, errors, jobs, infra |
| `docs/live/04-api-reference.md` | All HTTP endpoints |
| `docs/live/05-database.md` | Entities, migrations, RLS, seed |
| `docs/live/06-frontend-backend-sync.md` | Route ↔ API mapping, gaps |
| `docs/live/CHANGELOG.md` | Chronological change log |
| `docs/decisions/*.md` | Architecture decision records (ratified) |

## Maintenance checklist (for each code change)

- [ ] Feature status still accurate in `02-features.md`?
- [ ] New/changed routes in `04-api-reference.md`?
- [ ] New/changed entities/migrations in `05-database.md`?
- [ ] Frontend nav/pages synced in `06-frontend-backend-sync.md`?
- [ ] `system-context.md` summary updated?
- [ ] CHANGELOG entry added with files changed and why?
