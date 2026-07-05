import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { SmsService } from './sms.service';

class SendSmsDto {
  @IsUUID() contactId!: string;
  @IsUUID() fromNumberId!: string;
  @IsString() body!: string;
}

@Controller('sms')
export class SmsController {
  constructor(
    private readonly sms: SmsService,
    private readonly audit: AuditService,
  ) {}

  @Post('send')
  @Permissions('calls:write')
  @HttpCode(201)
  async send(@CurrentUser() user: AuthUser, @Body() dto: SendSmsDto) {
    const res = await this.sms.send(user.tenantId, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'sms.send',
      entityType: 'message', entityId: res.messageId, detail: { contactId: dto.contactId },
    });
    return res;
  }
}
