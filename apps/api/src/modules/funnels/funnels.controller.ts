import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { FunnelsService } from './funnels.service';

class CreatePageDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsArray() content?: unknown[];
}

class UpdatePageDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsArray() content?: unknown[];
  @IsOptional() @IsBoolean() published?: boolean;
}

class FunnelStepDto {
  @IsUUID() landingPageId!: string;
  @IsOptional() position!: number;
}

class CreateFunnelDto {
  @IsString() name!: string;
  @ValidateNested({ each: true }) @Type(() => FunnelStepDto)
  steps!: FunnelStepDto[];
}

@Controller('funnels')
export class FunnelsController {
  constructor(private readonly funnels: FunnelsService) {}

  @Get('pages')
  @Permissions('funnels:read')
  listPages(@CurrentUser() user: AuthUser) {
    return this.funnels.listPages(user.tenantId);
  }

  @Post('pages')
  @Permissions('funnels:write')
  @HttpCode(201)
  createPage(@CurrentUser() user: AuthUser, @Body() dto: CreatePageDto) {
    return this.funnels.createPage(user.tenantId, dto.name, (dto.content ?? []) as never);
  }

  @Patch('pages/:id')
  @Permissions('funnels:write')
  updatePage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.funnels.updatePage(user.tenantId, id, dto as never);
  }

  @Get('pages/:slug')
  @Public()
  publicPage(@Param('slug') slug: string) {
    return this.funnels.publicPage(slug);
  }

  @Get()
  @Permissions('funnels:read')
  list(@CurrentUser() user: AuthUser) {
    return this.funnels.listFunnels(user.tenantId);
  }

  @Post()
  @Permissions('funnels:write')
  @HttpCode(201)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFunnelDto) {
    return this.funnels.createFunnel(user.tenantId, dto.name, dto.steps);
  }
}
