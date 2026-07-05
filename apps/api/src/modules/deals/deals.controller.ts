import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { DealsService } from './deals.service';

class CreateDealDto {
  @IsUUID() pipelineId!: string;
  @IsUUID() stageId!: string;
  @IsString() @MaxLength(255) name!: string;
  @IsOptional() @IsUUID() contactId?: string | null;
  @IsOptional() @IsUUID() companyId?: string | null;
  @IsOptional() @IsString() valueCents?: string | null;
  @IsOptional() @IsUUID() ownerUserId?: string | null;
}

class MoveDealDto {
  @IsUUID() stageId!: string;
}

@Controller('deals')
export class DealsController {
  constructor(
    private readonly deals: DealsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('deals:read')
  list(
    @CurrentUser() user: AuthUser,
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('ownerUserId') ownerUserId?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.deals.list(user.tenantId, { pipelineId, stageId, ownerUserId, status, companyId, contactId });
  }

  @Get(':id')
  @Permissions('deals:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.deals.getById(user.tenantId, id);
  }

  @Post()
  @Permissions('deals:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDealDto) {
    const row = await this.deals.create(user.tenantId, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'deal.create',
      entityType: 'deal', entityId: row.id, detail: { name: row.name, contactId: row.contactId },
    });
    return row;
  }

  @Patch(':id')
  @Permissions('deals:write')
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: Partial<CreateDealDto>) {
    const row = await this.deals.update(user.tenantId, id, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'deal.update',
      entityType: 'deal', entityId: id, detail: {},
    });
    return row;
  }

  @Post(':id/move')
  @Permissions('deals:write')
  async move(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: MoveDealDto) {
    const { deal, fromStageId } = await this.deals.move(user.tenantId, id, dto.stageId);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'deal.stage_move',
      entityType: 'deal', entityId: id,
      detail: { fromStageId, toStageId: dto.stageId, contactId: deal.contactId },
    });
    return deal;
  }

  @Delete(':id')
  @Permissions('deals:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deals.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'deal.delete',
      entityType: 'deal', entityId: id, detail: {},
    });
  }
}
