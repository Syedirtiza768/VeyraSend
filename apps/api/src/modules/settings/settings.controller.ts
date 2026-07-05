import { Body, Controller, Get, HttpCode, Put } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from './settings.service';

class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(400)
  webhookVerificationKey?: string | null;
  @IsOptional() @IsInt() @Min(1) @Max(3650)
  eventRetentionDays?: number;
  @IsOptional() @IsInt() @Min(1) @Max(3650)
  messageRetentionDays?: number;
  @IsOptional() @IsInt() @Min(1) @Max(3650)
  inboundRetentionDays?: number;
}

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('settings:read')
  get(@CurrentUser() user: AuthUser) {
    return this.settings.get(user.tenantId);
  }

  @Put()
  @Permissions('settings:write')
  @HttpCode(200)
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    const row = await this.settings.update(user.tenantId, {
      webhookVerificationKey: dto.webhookVerificationKey ?? undefined,
      eventRetentionDays: dto.eventRetentionDays,
      messageRetentionDays: dto.messageRetentionDays,
      inboundRetentionDays: dto.inboundRetentionDays,
    });
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'settings.update',
      entityType: 'tenant_settings', entityId: user.tenantId, detail: { ...row, webhookVerificationKey: row.webhookVerificationKey ? '[redacted]' : null },
    });
    return row;
  }
}
