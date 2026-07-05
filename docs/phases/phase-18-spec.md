# Phase 18 — SaaS Agency Layer

Status: **complete** · Gate: see §4 · Depends on Phases 13, 17 (complete)

## 1. Goal

Ship a two-level tenant hierarchy (agency → sub-accounts), audited act-as elevation, billing plan catalog, feature-flag resolution, agency usage rollup, and minimal agency admin UI.

## 2. Scope

In scope: `tenants` extended (`parent_tenant_id`, `type`, `white_label_config`, `billing_plan_id`); `billing_plans`, `feature_flags` tables; `agency` module; session act-as; `/api/usage/agency-rollup`; `/api/audit/agency`; frontend agency pages + act-as banner.

Out of scope: super_admin platform role; custom domain routing; Stripe Connect agency rebilling math; per-sub-account branding overrides.

## 3. Acceptance gate

1. Sub-account siblings cannot read each other's data (404 cross-tenant).
2. Act-as start/end fully audited.
3. Nesting sub-account under sub-account rejected (`400 nesting_not_allowed`).
4. Agency usage rollup lists sub-accounts.
5. Tests pass (`phase-18.spec.ts`).

## 4. Deliverables

| Area | Artifact |
|---|---|
| DB | `1700000018000-Phase18Agency.ts`, `1700000018001-BackfillPhase18Permissions.ts` |
| API | `agency/` module, act-as session, usage rollup, audit agency view |
| UI | `/agency/sub-accounts`, `/agency/branding`, `/agency/billing-plans`, `/agency/feature-flags`, act-as banner |
| Tests | `apps/api/test/phase-18.spec.ts` |
