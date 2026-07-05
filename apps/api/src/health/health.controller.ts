import { Controller, Get, HttpCode, Logger } from '@nestjs/common';
import { ChecksService } from './checks.service';
import { Public } from '../common/decorators/public.decorator';
import type { HealthResponse } from '@veyrasend/shared';

@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger('HealthController');

  constructor(private readonly checks: ChecksService) {}

  @Get()
  @HttpCode(200)
  async health(): Promise<HealthResponse> {
    const [db, redis] = await Promise.all([this.checks.db(), this.checks.redis()]);
    const checks = { db, redis };
    const allOk = db.status === 'ok' && redis.status === 'ok';
    const status = allOk ? 'ok' : 'degraded';

    if (!allOk) {
      this.logger.warn(`Health degraded: ${JSON.stringify(checks)}`);
    }

    return {
      status,
      service: 'veyrasend-api',
      checks,
      time: new Date().toISOString(),
    };
  }
}
