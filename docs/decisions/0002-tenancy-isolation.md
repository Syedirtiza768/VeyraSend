# ADR-0002 — Tenancy isolation: single DB, tenant_id row scoping

Date: 2026-06-30 · Status: Accepted · Supersedes: none

## Context

Two isolation models were considered (brief §5): single DB with `tenant_id`
row scoping vs. schema-per-tenant.

## Decision

Single PostgreSQL database with `tenant_id` row scoping on every business
entity, plus DB-level safeguards.

## Consequences

- Every business table carries a non-null `tenant_id` column with an index on
  `(tenant_id, …)` for common filters.
- No cross-tenant query path is permitted. Tenant scoping is enforced by:
  1. A global NestJS interceptor that injects the resolved tenant into the
     request context.
  2. A tenant-aware base repository / query builder that refuses to run a query
     lacking a tenant filter (build-breaking lint/test in Phase 1).
  3. Row-level security policies on tenant-scoped tables as a backstop.
- Client-supplied `tenant_id` is never trusted; it is derived from the session.
- Migrations must add `tenant_id` and the RLS policy atomically.
- A missing tenant scope in any repository method is treated as a bug, not a
  convenience.
