import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';

/**
 * Global authentication guard. Public routes (IS_PUBLIC_KEY) are skipped.
 * Otherwise the session must carry userId + tenantId; the AuthUser is loaded
 * from the DB and attached to the request (req.user, req.tenantId).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const session = req.session as {
      userId?: string;
      tenantId?: string;
      homeTenantId?: string;
      actAsElevation?: boolean;
    } | undefined;
    const userId = session?.userId;
    const tenantId = session?.tenantId;
    if (!userId || !tenantId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const authUser = await this.auth.loadAuthUser(userId, tenantId, {
      homeTenantId: session?.homeTenantId,
      actAsElevation: session?.actAsElevation,
    });
    if (!authUser) {
      throw new UnauthorizedException('Session is no longer valid.');
    }
    req.user = authUser;
    req.tenantId = authUser.tenantId;
    return true;
  }
}

/**
 * Global authorization guard. Runs after AuthGuard. If a route declares
 * @Permissions(...), the authenticated user must hold at least one of them
 * for the active tenant.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>('requiredPermissions', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const perms = req.user?.permissions ?? [];
    const ok = required.some((p) => perms.includes(p));
    if (!ok) {
      throw new ForbiddenException(`Missing permission: ${required.join(' | ')}`);
    }
    return true;
  }
}
