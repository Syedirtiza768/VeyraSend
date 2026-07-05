import { CallHandler, ExecutionContext, Injectable, NestInterceptor, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Enforces tenant scope on non-public routes. By the time this runs, AuthGuard
 * has attached req.tenantId; if it is missing the request is rejected before
 * any service work begins (ADR-0002: a missing tenant scope is a build-
 * breaking bug).
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return next.handle();

    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.tenantId) {
      throw new UnauthorizedException('Tenant scope missing — refusing to handle request.');
    }
    return next.handle();
  }
}
