import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface CheckResult {
  status: 'ok' | 'down';
  detail?: string;
}

/**
 * Probes external dependencies. Health is honest: if Postgres or Redis is
 * unreachable the endpoint reports degraded/down rather than pretending ok.
 */
@Injectable()
export class ChecksService {
  private readonly logger = new Logger('ChecksService');

  constructor(private readonly config: ConfigService) {}

  async db(): Promise<CheckResult> {
    // Lazy require so the API can boot even if pg fails to load at runtime.
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: this.config.databaseUrl });
    try {
      const res = await pool.query('SELECT 1 AS ok');
      return res.rows[0]?.ok === 1 ? { status: 'ok' } : { status: 'down', detail: 'no row' };
    } catch (err) {
      this.logger.warn(`DB health check failed: ${(err as Error).message}`);
      return { status: 'down', detail: (err as Error).message };
    } finally {
      await pool.end();
    }
  }

  async redis(): Promise<CheckResult> {
    const Redis = (await import('ioredis')).default;
    const client = new Redis(this.config.redisUrl, {
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    try {
      await client.connect();
      const pong = await client.ping();
      return pong === 'PONG' ? { status: 'ok' } : { status: 'down', detail: pong };
    } catch (err) {
      this.logger.warn(`Redis health check failed: ${(err as Error).message}`);
      return { status: 'down', detail: (err as Error).message };
    } finally {
      client.disconnect();
    }
  }
}
