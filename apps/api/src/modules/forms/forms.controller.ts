import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { PublicRateLimitService, assertRateLimit } from '../../common/public-rate-limit.service';
import { FormsService } from './forms.service';

class CreateFormDto {
  @IsString() @MaxLength(120) name!: string;
}

class FieldDto {
  @IsString() label!: string;
  @IsString() fieldKey!: string;
  @IsString() fieldType!: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() position!: number;
  @IsOptional() @IsArray() options?: string[];
}

class ReplaceFieldsDto {
  @ValidateNested({ each: true }) @Type(() => FieldDto)
  fields!: FieldDto[];
}

@Controller('forms')
export class FormsController {
  constructor(
    private readonly forms: FormsService,
    private readonly rateLimit: PublicRateLimitService,
  ) {}

  @Get()
  @Permissions('forms:read')
  list(@CurrentUser() user: AuthUser) {
    return this.forms.list(user.tenantId);
  }

  @Get(':id')
  @Permissions('forms:read')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.forms.getById(user.tenantId, id);
  }

  @Post()
  @Permissions('forms:write')
  @HttpCode(201)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFormDto) {
    return this.forms.create(user.tenantId, dto.name);
  }

  @Patch(':id/fields')
  @Permissions('forms:write')
  replaceFields(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReplaceFieldsDto) {
    return this.forms.replaceFields(user.tenantId, id, dto.fields);
  }

  @Get(':id/submissions')
  @Permissions('forms:read')
  submissions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.forms.listSubmissions(user.tenantId, id);
  }

  @Post(':id/submit')
  @Public()
  @SkipCsrf()
  @HttpCode(201)
  submit(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: Request) {
    assertRateLimit(this.rateLimit, `form:${req.ip}:${id}`, 20, 60_000);
    return this.forms.submit(id, body, req.ip ?? null);
  }
}
