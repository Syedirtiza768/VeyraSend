# Phase plan

Each phase: (a) write spec to `docs/phases/phase-N-spec.md`, (b) get sign-off,
(c) implement with migrations + tests, (d) demo against the acceptance gate,
(e) update `SUPPORTED.md`.

| Phase | Name | Gate (one-line) | Status |
|---|---|---|---|
| 0 | Foundations & Decisions | repo boots, dev runs, config fails fast, decisions ratified | Awaiting sign-off |
| 1 | Auth, Tenancy, RBAC, Users | Tenant A cannot read Tenant B; RBAC blocks unauthorized | Approved |
| 2 | SendGrid Integration + Senders/Domains | Store config, add sender, see real verification, view DNS | Awaiting sign-off |
| 3 | Transactional Send + Event Webhooks | Send; delivered/open/click/bounce land, verified + deduped | Complete |
| 4 | Contacts, Lists, Segments, Suppressions | Import CSV, build segment, suppress contact, excluded from sends | Complete |
| 5 | Templates | Versioned template with vars, preview, test send renders | Complete |
| 6 | Campaigns | Schedule to segment; sends on time, respects suppressions, live perf | Complete |
| 7 | Inbound / Inbox | Reply threads to right contact, attachments intact | Complete |
| 8 | Automations | Welcome sequence with delay + branch runs end-to-end | Complete |
| 9 | Analytics & Dashboards | Dashboards reconcile against raw event counts | Complete |
| 10 | Admin, Settings, Audit, Usage/Billing, Retention | Admin manages tenants/users, views usage + audit | Complete |
| 11 | Hardening & Handoff | Fresh env from docs + seed passes smoke test | Complete |
