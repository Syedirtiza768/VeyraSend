import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { TwilioIntegrationService } from './twilio-integration.service';

@Controller('twilio')
export class TwilioIntegrationController {
  constructor(
    private readonly twilio: TwilioIntegrationService,
    private readonly audit: AuditService,
  ) {}

  @Get('status')
  @Permissions('twilio:provision')
  status(@CurrentUser() user: AuthUser) {
    return this.twilio.getStatus(user.tenantId);
  }

  @Post('provision')
  @Permissions('twilio:provision')
  @HttpCode(201)
  async provision(@CurrentUser() user: AuthUser) {
    const res = await this.twilio.provision(user.tenantId);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'twilio.provision',
      entityType: 'twilio_settings', entityId: null, detail: { subaccountSid: res.subaccountSid },
    });
    return res;
  }
}
