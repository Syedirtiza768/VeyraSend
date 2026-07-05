import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { NO_CSRF_KEY } from '../decorators/skip-csrf.decorator';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Double-submit CSRF: a non-HttpOnly `csrf` cookie holds a random token that
 * the client echoes back via the `x-csrf-token` header on mutations. Missing
 * or mismatched → 403. SameSite=Lax on the session cookie blocks cross-site
 * submits; this guard blocks them even when a malicious form can ride along.
 *
 * Routes marked `@SkipCsrf()` (inbound webhooks that verify their own
 * signatures) are exempt.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.includes(req.method)) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(NO_CSRF_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (skip) return true;

    const cookieToken = req.cookies?.csrf as string | undefined;
    const headerToken = req.header('x-csrf-token');
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Invalid or missing CSRF token.');
    }
    return true;
  }
}
