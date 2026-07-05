import type { Request } from 'express';

/** Permissions attached to the authenticated user for the active tenant. */
export interface AuthUser {
  userId: string;
  email: string;
  name: string | null;
  tenantId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  /** Set when an agency user is elevated into a sub-account. */
  actAs?: {
    homeTenantId: string;
    homeTenantName: string;
    subAccountId: string;
    subAccountName: string;
  };
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
    tenantId?: string;
    correlationId?: string;
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    tenantId?: string;
    roleId?: string;
    permissions?: string[];
    /** Agency tenant id when elevated into a sub-account. */
    homeTenantId?: string;
    actAsElevation?: boolean;
  }
}

/** Extract tenant id from the request (set by the auth guard). */
export function getTenantId(req: Request): string | undefined {
  return req.tenantId ?? req.user?.tenantId;
}
