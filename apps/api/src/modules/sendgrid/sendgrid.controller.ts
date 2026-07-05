import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { SendgridService } from './sendgrid.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../../common/auth.types';

@Controller('sendgrid')
export class SendgridController {
  constructor(
    private readonly sendgrid: SendgridService,
    private readonly audit: AuditService,
  ) {}

  @Get('status')
  @Permissions('sendgrid:provision')
  async status(@CurrentUser() user: AuthUser) {
    return this.sendgrid.getStatus(user.tenantId);
  }

  @Post('provision')
  @Permissions('sendgrid:provision')
  @HttpCode(200)
  async provision(@CurrentUser() user: AuthUser) {
    const result = await this.sendgrid.provision(user.tenantId, user.email);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'sendgrid.provision',
      entityType: 'tenant',
      entityId: user.tenantId,
      detail: { region: result.region, subuserUsername: result.subuserUsername },
    });
    return result;
  }
}
