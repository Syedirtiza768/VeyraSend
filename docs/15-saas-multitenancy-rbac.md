# 15 — SaaS Multi-Tenancy & RBAC

## Extending, not replacing, ADR-0002

ADR-0002 (single DB, `tenant_id` row scoping, RLS backstop) is retained.
This doc adds the agency hierarchy and role model on top of it — no change
to how row isolation works for a single tenant's own data.

## Tenant hierarchy

`tenants.type` ∈ `direct` | `agency` | `sub_account`; `tenants.parent_tenant_id`
self-references. Rules:

- A `direct` tenant has no parent and no children — today's model,
  unchanged, majority of tenants.
- An `agency` tenant has no parent and one or more `sub_account` children
  (`parent_tenant_id` pointing at it).
- A `sub_account` behaves exactly like a `direct` tenant for every existing
  module (its own `Contact`s, `Deal`s, `Message`s, RLS-isolated identically)
  — the only difference is it has a `parent_tenant_id` and its billing rolls
  up to the parent agency (`18` / usage docs).
- A `sub_account` cannot itself have children (no three-level nesting) —
  enforced at the application layer (`400 nesting_not_allowed` if someone
  tries to set `parent_tenant_id` on a tenant that already has one, or set
  it to a tenant that's itself a `sub_account`).

## Roles: platform, agency, tenant

Three tiers, not one flat list:

| Tier | Roles | Scope |
|---|---|---|
| Platform | `super_admin` | Cross-tenant, VeyraSend operator only — not sold to customers. Manages billing plans, feature flags globally, can view (not silently edit) any tenant for support purposes, every access logged. |
| Agency | `agency_owner`, `agency_admin`, `agency_member` | Scoped to the agency tenant + explicit "act as" access into its sub-accounts (see below) |
| Tenant (existing, unchanged) | `owner`, `admin`, `member` | Scoped to one tenant (`direct` or `sub_account`), exactly as today |

Agency roles are a **new role class**, not an extension of the existing
tenant `roles` table's `permissions text[]` shape, because agency
permissions are meaningfully different in kind (they include "list my
sub-accounts," "create a sub-account," "elevate into sub-account X") not
just a bigger set of the same `resource:action` strings. Model as: agency
tenant's `roles` rows get an additional set of `agency:*` permission
strings (`agency:sub-accounts:read`, `agency:sub-accounts:write`,
`agency:act-as`) — reuses the existing `roles.permissions text[]` +
`@Permissions()` guard mechanism rather than inventing a parallel RBAC
system. The distinction above is conceptual (what the permissions mean),
not a new data structure.

## "Act as" elevation (the one cross-tenant escape hatch)

An agency admin with `agency:act-as` can start a session elevation into one
of their sub-accounts:

```
POST /api/agency/sub-accounts/:id/act-as
  → verify caller's tenant is the sub-account's parent
  → verify caller has agency:act-as permission
  → write an audit_logs row (tenant_id = sub-account, action='agency.act_as.start',
    detail={ agencyTenantId, agencyUserId })
  → mutate the session's active tenant context to the sub-account
    for the remainder of the session (or until "return to agency view")
  → every subsequent request behaves exactly as if that user were a member
    of the sub-account tenant — same tenant guard, same RLS, no new code path
```

This is intentionally the **only** mechanism by which one tenant's session
can act on another tenant's data — there is no generic "agency admins can
query any sub-account" backdoor in the query layer. The elevation is
explicit, time-bounded (ends on logout or explicit "return"), and every
elevation start/end is an audited event. The frontend shows a persistent,
unmissable banner while elevated (`06-frontend-information-architecture.md`)
— this is a hard requirement, not a nice-to-have, because silent
cross-account action is the exact failure mode multi-tenant SaaS security
reviews flag first.

## Permissions reference (additions to the existing table, full list per phase spec)

New `resource:action` strings introduced by this expansion follow the
existing convention exactly: `companies:*`, `deals:*`, `pipelines:*`,
`tasks:*`, `notes:*`, `tags:*`, `conversations:*`, `phone-numbers:*`,
`calls:*`, `workflows:read|write|publish`, `calendar:*`, `appointments:*`,
`forms:*`, `funnels:*`, `reputation:*`, `billing:*`, `agency:*`. Each
phase's spec (`18-implementation-roadmap.md`) lists exactly which
permissions it introduces and which system role (owner/admin/member) gets
which by default — not enumerated exhaustively here to avoid this document
drifting out of sync with the phase specs that are the source of truth.

## White-label & branding

Agency-level `white_label_config jsonb` on the agency's `tenants` row
(logo URL, primary color override, product name override, support email).
Sub-accounts inherit their parent agency's white-label config by default;
no per-sub-account override in this phase (keeps the model simple — an
agency's brand applies uniformly across its book of business). Custom
domain routing (`agency.example.com` → resolves to that agency's tenant
context) is a reverse-proxy/DNS concern documented in
`17-deployment-devops.md`, not an application-layer change beyond storing
the domain→tenant mapping.

## Feature flags & billing plans

`feature_flags(tenant_id nullable, key, enabled)` — a tenant's effective
flag value is: explicit per-tenant row if present, else the plan's default
(`billing_plans.feature_flags`), else the global-default row. This
three-level fallback (tenant override → plan default → global default) is
the intended resolution order — document it exactly like this in code
comments where the resolution function lives, since it's easy to get the
precedence backwards.
