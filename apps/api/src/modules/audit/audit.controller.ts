import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditReaderService } from './audit-reader.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly reader: AuditReaderService) {}

  @Get()
  @Permissions('audit:read')
  list(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.reader.list(user.tenantId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      action: action || undefined,
      entityType: entityType || undefined,
    });
  }

  @Get('agency')
  @Permissions('audit:read', 'agency:sub-accounts:read')
  agencyElevations(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    const agencyId = user.actAs?.homeTenantId ?? user.tenantId;
    return this.reader.agencyElevationEvents(agencyId, limit ? Number(limit) : 50);
  }
}
