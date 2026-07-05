# Technical Reference (Live)

> Last verified: **2026-07-05**

## Repository layout

```
apps/api/           NestJS backend (port 4000)
apps/web/           Next.js frontend (port 3040)
packages/config/    Zod-validated env, fail-fast at boot
packages/db/        TypeORM entities + migrations
packages/sendgrid/  SendGrid API wrapper (sole SendGrid access path)
packages/twilio/    Twilio API wrapper (sole Twilio access path)
packages/shared/    Cross-boundary enums and API shapes
```

## Authentication flow

1. User submits email/password to `POST /api/auth/login` (`@Public()`).
2. `AuthService` verifies argon2id hash, loads user + tenant membership + role permissions.
3. Session created in Redis with `userId`, `tenantId`, `roleId`; session id rotated.
4. CSRF token returned in response body; stored in non-HttpOnly `csrf` cookie.
5. Subsequent mutations: client sends `x-csrf-token` header matching cookie.
6. `GET /api/auth/me` returns user, tenant, role, permissions for SSR and layout.

**Guards (global, in order):** `AuthGuard` → `CsrfGuard` → `PermissionsGuard`
(`apps/api/src/app.module.ts`)

**Public routes:** `/health`, `/api/auth/csrf`, `/api/auth/login`, `/api/install`, all `/api/webhooks/*`.

**Session config:** `apps/api/src/http-setup.ts` — HttpOnly, Secure, SameSite=Lax cookie.

## Authorization

- Decorator: `@Permissions('resource:action')` on controller methods.
- Guard requires user holds **at least one** listed permission.
- Full permission list: `packages/db/src/entities/role.entity.ts` (`PERMISSIONS` constant — 67 strings).
- Nav dimming: `apps/web/app/(authed)/layout.tsx` hides links without permission.

## Tenant isolation

Three layers (ADR-0002):

1. **Application:** `TenantInterceptor` rejects requests without `req.tenantId` from session.
2. **Repository:** All queries filter by `tenantId` from session context — never from request body.
3. **Database:** PostgreSQL RLS on all tenant-scoped tables via `current_setting('app.tenant_id')`.

Tables without RLS: `tenants`, `users` (global identity).

## Validation

- **Request bodies:** `class-validator` DTOs on NestJS controllers.
- **Env config:** Zod schemas in `packages/config/` — API fails fast if invalid.
- **Shared contracts:** Enums in `packages/shared/src/index.ts` (partially disconnected from runtime — see debt).

## Error handling

Standard shape from `packages/shared`:

```typescript
interface ApiError {
  error: { code: string; message: string };
}
```

Success envelope:

```typescript
interface ApiResult<T> {
  data: T;
}
```

NestJS exceptions map to HTTP status codes. Cross-tenant lookups return **404**, not 403.

## Background jobs

### BullMQ — `mail` queue

| Setting | Value |
|---|---|
| File | `apps/api/src/modules/queue/queue.service.ts` |
| Job name | `send` |
| Attempts | 6, exponential backoff from 2000ms |
| Concurrency | 8 |
| Action | Decrypt tenant SendGrid key → `SendGridClient.sendMail()` → update `Message.status` |

Enqueued by: transactional send, campaign send, automation send steps.

SMS/voice sends are **synchronous** in request handlers today (no BullMQ SMS queue yet).

### In-process tickers (not BullMQ)

| Service | Interval | Action |
|---|---|---|
| `CampaignsService.tickScheduled()` | 20s | Fire due scheduled campaigns |
| `AutomationsService.tick()` | 20s | Enroll contacts + advance automation steps |
| `RetentionService.tick()` | 1 hour | Purge old messages/events/inbound per tenant settings |

No `@nestjs/schedule` or cron decorators — plain `setInterval`.

## Webhook ingestion

| Endpoint | Verification | Dedup |
|---|---|---|
| `POST /api/webhooks/events` | ECDSA via SendGrid headers | `sg_event_id` unique |
| `POST /api/webhooks/inbound` | Optional shared secret query param | Per-message idempotency key |
| `POST /api/webhooks/twilio/sms` | `X-Twilio-Signature` (mandatory) | Provider message SID |
| `POST /api/webhooks/twilio/voice` | `X-Twilio-Signature` (mandatory) | Call SID |
| `POST /api/webhooks/twilio/voice/status` | `X-Twilio-Signature` (mandatory) | Status callback |

Raw body captured for event webhook signature verification in `http-setup.ts`.

## SendGrid integration rules

- **All** SendGrid HTTP calls go through `packages/sendgrid/SendGridClient`.
- Per-tenant subuser API key encrypted at rest (AES-256-GCM).
- Mock mode when `SENDGRID_PARENT_API_KEY` unset — tested code path.
- Rate limit: 429 handling with jittered backoff in sendgrid package.

## Twilio integration rules (ADR-0007)

- **All** Twilio HTTP calls go through `packages/twilio/TwilioClient`.
- Per-tenant subaccount auth token encrypted at rest.
- Mock mode when parent credentials unset — signature verification accepts `mock-valid-signature` in tests.
- Inbound SMS/voice routed to contact by phone; conversations linked via `ConversationsService`.

## Frontend architecture

| Pattern | Location |
|---|---|
| Server data fetch | `apps/web/lib/server-api.ts` — forwards cookies, `cache: 'no-store'` |
| Client mutations | `apps/web/lib/client-api.ts` — CSRF-aware fetch |
| Client cache | TanStack Query on CRM + conversations (`query-provider.tsx`) |
| Page pattern | Server component initial data → client `*-manager.tsx` for writes |
| Design system | EnXi CSS variables, `class="enxi-product"` wrapper |
| Auth gate | `(authed)/layout.tsx` calls `getCurrentUser()`, redirects to `/login` |

**Not used:** global state manager, component library, form library.

## Environment variables

Documented in `.env.example`. Key vars:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Sessions + BullMQ |
| `SESSION_SECRET` | Express session signing |
| `ENCRYPTION_KEY` | Subuser/subaccount key encryption |
| `SENDGRID_PARENT_API_KEY` | Parent account for subuser provisioning |
| `SENDGRID_WEBHOOK_VERIFICATION_KEY` | Event webhook ECDSA verification |
| `SENDGRID_INBOUND_PARSE_SECRET` | Optional inbound parse shared secret |
| `API_BASE` / `NEXT_PUBLIC_API_BASE` | Web → API URL |

## Testing

- 14 Jest/Supertest suites in `apps/api/test/` (phases 0–11 + CRM + Twilio + conversations + tenant isolation).
- CI: GitHub Actions — install, typecheck, lint, build (**tests not gated in CI yet**).

## Known technical debt

| Issue | Severity | Reference |
|---|---|---|
| Inbound webhook secret optional in dev | Security | Set `SENDGRID_INBOUND_PARSE_SECRET` in production |
| Automation enum types not all wired | Partial impl | `02-features.md` |
| Lists UI missing member management | UI gap | `06-frontend-backend-sync.md` |
| Tags/custom-fields UI partial on CRM screens | UI gap | `02-feature-matrix-ghl-style.md` |
| Dashboard stale Phase 1 copy | Content | `06-frontend-backend-sync.md` |
| No API versioning | Design | No `/api/v1` prefix |
| No rate limiting | Security | Login + webhooks unthrottled |
| No Bull Board / queue observability | Ops | — |
| CORS hardcoded to localhost | Deploy | `http-setup.ts` |
| `packages/shared` enums vs runtime literals | Code hygiene | `00-current-state-audit.md` §8 |
| ADR-0004 product framing superseded by P14 | Docs | ADR-0008 not yet written |
| CI does not run test suite | Process | `21-testing-strategy.md` |

## Architecture decisions (ratified)

| ADR | Topic | File |
|---|---|---|
| 0001 | SendGrid parent + subusers | `docs/decisions/0001-sendgrid-integration-model.md` |
| 0002 | Single DB, tenant_id scoping + RLS | `docs/decisions/0002-tenancy-isolation.md` |
| 0003 | Session cookie + CSRF | `docs/decisions/0003-auth-model.md` |
| 0004 | Inbound Parse replies only *(email channel constraint still valid)* | `docs/decisions/0004-inbound-inbox-scope.md` |
| 0005 | Marketing vs transactional split | `docs/decisions/0005-marketing-transactional-split.md` |
| 0006 | Tech stack and monorepo layout | `docs/decisions/0006-tech-stack-and-layout.md` |
| 0007 | Twilio parent + subaccounts | `docs/decisions/0007-twilio-integration-model.md` |

ADR-0004 product-level framing superseded by Phase 14 unified inbox — see `docs/22-open-questions-and-decisions.md` #4.
