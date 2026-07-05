import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ChecksService } from './checks.service';

@Module({
  controllers: [HealthController],
  providers: [ChecksService],
})
export class HealthModule {}
