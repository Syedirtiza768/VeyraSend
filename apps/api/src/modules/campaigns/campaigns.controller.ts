import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { CampaignsService, type CreateCampaignInput } from './campaigns.service';

class CreateCampaignDto {
  @IsString() @MaxLength(120) name!: string;
  @IsUUID() templateId!: string;
  @IsUUID() segmentId!: string;
  @IsString() @MaxLength(255) fromEmail!: string;
  @IsOptional() @IsString() @MaxLength(120) fromName?: string | null;
  @IsOptional() @IsString() @MaxLength(255) subject?: string | null;
  @IsOptional() @IsISO8601() scheduledAt?: string | null;
}

class ScheduleDto {
  @IsOptional() @IsISO8601() scheduledAt?: string | null;
}

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('campaigns:read')
  list(@CurrentUser() user: AuthUser) {
    return this.campaigns.list(user.tenantId);
  }

  @Get(':id')
  @Permissions('campaigns:read')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaigns.getById(user.tenantId, id);
  }

  @Get(':id/stats')
  @Permissions('campaigns:read')
  stats(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaigns.stats(user.tenantId, id);
  }

  @Post()
  @Permissions('campaigns:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    const row = await this.campaigns.create(user.tenantId, dto as CreateCampaignInput);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'campaign.create',
      entityType: 'campaign', entityId: row.id, detail: { name: row.name },
    });
    return row;
  }

  @Post(':id/send')
  @Permissions('campaigns:write')
  @HttpCode(200)
  async send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const row = await this.campaigns.sendNow(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'campaign.send',
      entityType: 'campaign', entityId: id, detail: { recipients: row.recipients },
    });
    return row;
  }

  @Post(':id/schedule')
  @Permissions('campaigns:write')
  @HttpCode(200)
  async schedule(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ScheduleDto) {
    const row = await this.campaigns.schedule(user.tenantId, id, dto.scheduledAt ?? null);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'campaign.schedule',
      entityType: 'campaign', entityId: id, detail: { scheduledAt: row.scheduledAt },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('campaigns:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.campaigns.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'campaign.delete',
      entityType: 'campaign', entityId: id, detail: {},
    });
  }
}
