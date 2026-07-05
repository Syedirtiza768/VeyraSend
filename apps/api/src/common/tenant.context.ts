import { Injectable } from '@nestjs/common';

/**
 * Holds the resolved tenant for the current request. Phase 0 ships the
 * structure only — no tenant is resolved yet (auth lands in Phase 1). Every
 * tenant-scoped repository call MUST obtain a tenantId from here (or from a
 * trusted internal caller) and refuse to run without one (ADR-0002).
 */
@Injectable()
export class TenantContextService {
  private currentTenant?: string;

  setTenant(tenantId: string): void {
    this.currentTenant = tenantId;
  }

  getTenantOrThrow(): string {
    if (!this.currentTenant) {
      throw new Error('Tenant scope missing — refusing to run a tenant-scoped operation.');
    }
    return this.currentTenant;
  }

  clear(): void {
    this.currentTenant = undefined;
  }
}
