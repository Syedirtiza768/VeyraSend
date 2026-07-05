import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { PipelinesService } from './pipelines.service';

class StageInputDto {
  @IsOptional() @IsString()
  id?: string;

  @IsString() @MaxLength(120)
  name!: string;

  @IsInt()
  position!: number;

  @IsOptional() @IsInt()
  probability?: number | null;

  @IsOptional() @IsBoolean()
  isWon?: boolean;

  @IsOptional() @IsBoolean()
  isLost?: boolean;
}

class CreatePipelineDto {
  @IsString() @MaxLength(120)
  name!: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => StageInputDto)
  stages!: StageInputDto[];
}

class ReplaceStagesDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => StageInputDto)
  stages!: StageInputDto[];
}

@Controller('pipelines')
export class PipelinesController {
  constructor(
    private readonly pipelines: PipelinesService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('pipelines:read')
  list(@CurrentUser() user: AuthUser) {
    return this.pipelines.list(user.tenantId);
  }

  @Post()
  @Permissions('pipelines:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreatePipelineDto) {
    const row = await this.pipelines.create(user.tenantId, dto.name, dto.stages);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'pipeline.create',
      entityType: 'pipeline', entityId: row.id, detail: { name: row.name },
    });
    return row;
  }

  @Patch(':id/stages')
  @Permissions('pipelines:write')
  async replaceStages(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReplaceStagesDto) {
    const row = await this.pipelines.replaceStages(user.tenantId, id, dto.stages);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'pipeline.stages.replace',
      entityType: 'pipeline', entityId: id, detail: { stageCount: dto.stages.length },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('pipelines:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.pipelines.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'pipeline.delete',
      entityType: 'pipeline', entityId: id, detail: {},
    });
  }
}
