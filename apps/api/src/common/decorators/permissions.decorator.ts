import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@veyrasend/db';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Requires any of the listed permissions for the active tenant. Enforced by
 * PermissionsGuard. RBAC is checked at the controller layer, never in the UI
 * (ADR-0002 / brief §8).
 */
export const Permissions = (...perms: Permission[]) => SetMetadata(PERMISSIONS_KEY, perms);
