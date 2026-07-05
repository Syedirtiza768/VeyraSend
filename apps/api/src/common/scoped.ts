import { ForbiddenException } from '@nestjs/common';

/**
 * Asserts a tenant id is present. Every tenant-scoped repository call MUST
 * pass through a tenant id; a missing one is a build-breaking bug (ADR-0002),
 * not a convenience. Never trust a client-supplied tenant id — it must come
 * from the authenticated session.
 */
export function assertTenant(tenantId: string | undefined | null): string {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new ForbiddenException('Tenant scope missing — refusing to run a tenant-scoped operation.');
  }
  return tenantId;
}
