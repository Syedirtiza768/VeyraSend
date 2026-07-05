import { Controller, Get } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { UsageService } from './usage.service';

@Controller('usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get()
  @Permissions('usage:read')
  overview(@CurrentUser() user: AuthUser) {
    return this.usage.overview(user.tenantId);
  }

  @Get('agency-rollup')
  @Permissions('usage:read', 'agency:sub-accounts:read')
  agencyRollup(@CurrentUser() user: AuthUser) {
    const agencyId = user.actAs?.homeTenantId ?? user.tenantId;
    return this.usage.agencyRollup(agencyId);
  }
}
