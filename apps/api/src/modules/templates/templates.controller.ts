import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { CreateTemplateInput } from './templates.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { TemplatesService } from './templates.service';

class VarDto {
  @IsString() key!: string;
  @IsOptional() @IsIn(['text', 'number', 'date', 'boolean']) type?: string;
  @IsOptional() @IsString() fallback?: string;
}

class CreateTemplateDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(255) subject!: string;
  @IsString() html!: string;
  @IsOptional() @IsString() text?: string | null;
  @IsOptional() @IsIn(['dynamic', 'legacy']) generation?: 'dynamic' | 'legacy';
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VarDto)
  variables?: VarDto[];
}

class UpdateTemplateDto {
  @IsOptional() @IsString() @MaxLength(255) subject?: string;
  @IsOptional() @IsString() html?: string;
  @IsOptional() @IsString() text?: string | null;
  @IsOptional() @IsIn(['dynamic', 'legacy']) generation?: 'dynamic' | 'legacy';
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VarDto)
  variables?: VarDto[];
}

class PreviewDto {
  @IsOptional() vars?: Record<string, unknown>;
}

class TestSendDto {
  @IsString() toEmail!: string;
  @IsOptional() vars?: Record<string, unknown>;
}

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templates: TemplatesService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('templates:read')
  list(@CurrentUser() user: AuthUser) {
    return this.templates.list(user.tenantId);
  }

  @Get(':id')
  @Permissions('templates:read')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.getById(user.tenantId, id);
  }

  @Post()
  @Permissions('templates:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    const row = await this.templates.create(user.tenantId, dto as unknown as CreateTemplateInput);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'template.create',
      entityType: 'template', entityId: row.id, detail: { name: row.name },
    });
    return row;
  }

  @Patch(':id')
  @Permissions('templates:write')
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    const row = await this.templates.update(user.tenantId, id, dto as unknown as Partial<CreateTemplateInput>);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'template.update',
      entityType: 'template', entityId: row.id, detail: { version: row.version },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('templates:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.templates.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'template.delete',
      entityType: 'template', entityId: id, detail: {},
    });
  }

  @Get(':id/versions')
  @Permissions('templates:read')
  versions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.versions(user.tenantId, id);
  }

  @Post(':id/preview')
  @Permissions('templates:read')
  @HttpCode(200)
  async preview(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: PreviewDto) {
    return this.templates.previewAsync(user.tenantId, id, dto.vars ?? {});
  }

  @Post(':id/test-send')
  @Permissions('templates:write')
  @HttpCode(200)
  async testSend(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: TestSendDto) {
    const res = await this.templates.testSend(user.tenantId, user.userId, id, dto.toEmail, dto.vars ?? {});
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'template.test_send',
      entityType: 'template', entityId: id, detail: { to: dto.toEmail, messageId: res.messageId },
    });
    return res;
  }
}
