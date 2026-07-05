import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { IsString, MaxLength, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import type { SegmentDefinition } from '@veyrasend/db';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { SegmentsService } from './segments.service';

class SegmentRuleDto {
  @IsString() field!: string;
  @IsIn(['eq', 'ne', 'contains', 'domain_eq']) op!: string;
  @IsString() value!: string;
}

class SegmentDefinitionDto {
  @IsIn(['and', 'or']) combinator!: 'and' | 'or';
  @IsArray() @ValidateNested({ each: true }) @Type(() => SegmentRuleDto)
  rules!: SegmentRuleDto[];
}

class CreateSegmentDto {
  @IsString() @MaxLength(120)
  name!: string;

  @ValidateNested() @Type(() => SegmentDefinitionDto)
  definition!: SegmentDefinitionDto;
}

@Controller('segments')
export class SegmentsController {
  constructor(
    private readonly segments: SegmentsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('segments:read')
  list(@CurrentUser() user: AuthUser) {
    return this.segments.list(user.tenantId);
  }

  @Post()
  @Permissions('segments:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSegmentDto) {
    const row = await this.segments.create(user.tenantId, dto.name, dto.definition as unknown as SegmentDefinition);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'segment.create',
      entityType: 'segment',
      entityId: row.id,
      detail: { name: row.name },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('segments:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.segments.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'segment.delete',
      entityType: 'segment',
      entityId: id,
      detail: {},
    });
  }

  @Get(':id/evaluate')
  @Permissions('segments:read')
  evaluate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.segments.evaluateById(user.tenantId, id);
  }
}
