import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { IsIn, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { AutomationDefinition } from '@veyrasend/db';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { AutomationsService } from './automations.service';

class StepDto {
  @IsIn(['send', 'delay', 'branch']) type!: string;
  templateId?: string;
  fromEmail?: string;
  fromName?: string;
  durationMs?: number;
  field?: string;
  op?: string;
  value?: string;
  thenStep?: number;
  elseStep?: number;
}

class TriggerDto {
  @IsIn(['contact.created']) event!: 'contact.created';
}

class DefinitionDto {
  @ValidateNested() @Type(() => TriggerDto)
  trigger!: TriggerDto;
  @ValidateNested({ each: true }) @Type(() => StepDto)
  steps!: StepDto[];
}

class CreateAutomationDto {
  @IsString() @MaxLength(120) name!: string;
  @ValidateNested() @Type(() => DefinitionDto)
  definition!: DefinitionDto;
}

class StatusDto {
  @IsIn(['active', 'paused']) status!: 'active' | 'paused';
}

@Controller('automations')
export class AutomationsController {
  constructor(
    private readonly automations: AutomationsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('automations:read')
  list(@CurrentUser() user: AuthUser) {
    return this.automations.list(user.tenantId);
  }

  @Get(':id')
  @Permissions('automations:read')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.automations.getById(user.tenantId, id);
  }

  @Get(':id/enrollments')
  @Permissions('automations:read')
  enrollments(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.automations.enrollments(user.tenantId, id);
  }

  @Post()
  @Permissions('automations:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAutomationDto) {
    const row = await this.automations.create(user.tenantId, { name: dto.name, definition: dto.definition as unknown as AutomationDefinition });
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'automation.create',
      entityType: 'automation', entityId: row.id, detail: { name: row.name },
    });
    return row;
  }

  @Post(':id/status')
  @Permissions('automations:write')
  @HttpCode(200)
  async setStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: StatusDto) {
    const row = await this.automations.setStatus(user.tenantId, id, dto.status);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'automation.status',
      entityType: 'automation', entityId: id, detail: { status: dto.status },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('automations:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.automations.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'automation.delete',
      entityType: 'automation', entityId: id, detail: {},
    });
  }
}
