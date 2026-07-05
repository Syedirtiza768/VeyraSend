# SUPPORTED.md — SendGrid capability gap analysis

> Living document. Updated as each phase lands. Statuses:
> **Supported** · **Partial** · **Deferred** · **Not feasible via SendGrid** ·
> **Pending** (not yet implemented).

Last updated: 2026-06-30 (Phase 2).

| Platform feature | SendGrid mechanism | Status | Caveat / notes |
|---|---|---|---|
| Auth (session + CSRF) | platform (not SendGrid) | **Supported** | Redis-backed session, argon2id, double-submit CSRF. See ADR-0003. |
| Tenancy + row isolation | `tenant_id` row scoping + RLS policies | **Supported** | App-level mandatory tenant filter + RLS defense-in-depth. See ADR-0002. |
| RBAC (roles + permissions) | platform (not SendGrid) | **Supported** | System roles owner/admin/member per tenant; `@Permissions` guard. |
| User management | platform (not SendGrid) | **Supported** | Tenant-scoped memberships; owner/admin can manage; member blocked. |
| Audit log | platform (not SendGrid) | **Supported** | Tenant-scoped; login, user create/update, install, sendgrid/sender/domain actions. |
| Per-tenant SendGrid subuser | Parent account + Subusers | **Supported** | One subuser per tenant, API key encrypted at rest; mock + real paths. See ADR-0001. |
| Sender identity | Single Sender Verification | **Supported** | Create/list/delete + resend verification; status surfaced. |
| Domain authentication | Domain Authentication (DNS/DKIM/SPF) | **Supported** | Create returns DNS records; verify reflects validation. Tenant adds DNS out-of-band. |
| Transactional / one-to-one / bulk send | Mail Send (`/mail/send`) | Pending (Phase 3/6) | Personalizations cap per request; large bulk chunked + queued. |
| Dynamic templates | Dynamic Templates + Handlebars vars | Pending (Phase 5) | Visual editor is SendGrid-hosted; local block editor must emit compatible HTML. |
| Scheduling | `send_at` (≤ ~72h) or platform scheduler | Pending (Phase 6) | Beyond SendGrid's window, schedule in our queue and release just-in-time. |
| Contacts / lists / segments | Marketing Campaigns contacts API | Pending (Phase 4) | Eventual consistency on upserts/segments; async reconciliation. |
| Suppressions / unsubscribe groups | Suppression + ASM APIs | Pending (Phase 4) | Global vs. group suppressions differ; honor both. |
| Sender identity | Single Sender Verification | Pending (Phase 2) | Manual per-address verification; surface status, never assume verified. |
| Domain authentication | Domain Authentication (DNS/DKIM/SPF) | Pending (Phase 2) | Generate records via API; tenant adds DNS; poll for verified status. |
| Delivery / engagement events | Event Webhook (signed) | Pending (Phase 3) | Verify signature. Open rate inflated by Apple Mail Privacy Protection — report with caveat. |
| Receiving email | Inbound Parse Webhook | Pending (Phase 7) | Replies on a controlled Inbound Parse domain only. Not a general inbox. |
| Forwarding arbitrary external mail | — | **Not feasible via SendGrid** | Out of scope; see ADR-0004. |
| Unified inbox across external providers | — | **Not feasible via SendGrid** | Out of scope; would require IMAP/external connectors. |
| Sending reputation / health | derived from events + auth status | Pending (Phase 9) | Not a single API field; derived metric. |
| Per-tenant isolation | Parent account + Subusers | Pending (Phase 2) | Row isolation already enforced (Phase 1); SendGrid Subuser provisioning lands in Phase 2. Requires Subuser-capable plan; mock mode until real key supplied. See ADR-0001. |
