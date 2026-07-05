import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @Permissions('analytics:read')
  overview(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    return this.analytics.overview(user.tenantId, days ? Number(days) : 30);
  }

  @Get('timeseries')
  @Permissions('analytics:read')
  timeseries(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    return this.analytics.timeseries(user.tenantId, days ? Number(days) : 30);
  }
}
