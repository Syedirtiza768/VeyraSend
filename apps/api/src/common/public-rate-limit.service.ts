import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/** Simple in-memory IP rate limiter for public endpoints (MVP). */
@Injectable()
export class PublicRateLimitService {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const row = this.hits.get(key);
    if (!row || now > row.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (row.count >= limit) return false;
    row.count += 1;
    return true;
  }
}

export function assertRateLimit(service: PublicRateLimitService, key: string, limit = 30, windowMs = 60_000): void {
  if (!service.check(key, limit, windowMs)) {
    throw new HttpException('rate_limited', HttpStatus.TOO_MANY_REQUESTS);
  }
}
