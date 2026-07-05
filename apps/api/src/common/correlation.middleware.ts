import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    correlationId?: string;
    tenantId?: string;
  }
}

/**
 * Assigns a per-request correlation id (from header if provided, else fresh)
 * and echoes it on the response. Structured logs should carry this id so a
 * request can be traced end to end, including tenant once auth lands.
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header('x-correlation-id');
    req.correlationId = incoming && /^[A-Za-z0-9-]{1,64}$/.test(incoming) ? incoming : randomUUID();
    res.setHeader('x-correlation-id', req.correlationId);
    next();
  }
}
