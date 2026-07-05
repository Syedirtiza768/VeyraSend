import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { CustomFieldsService } from './custom-fields.service';

class CreateFieldDto {
  @IsIn(['contact', 'deal', 'company']) entityType!: 'contact' | 'deal' | 'company';
  @IsString() @MaxLength(80) key!: string;
  @IsString() @MaxLength(120) label!: string;
  @IsIn(['text', 'number', 'date', 'boolean', 'select']) fieldType!: 'text' | 'number' | 'date' | 'boolean' | 'select';
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[] | null;
}

class SetValueDto {
  @IsUUID() customFieldId!: string;
  @IsIn(['contact', 'deal', 'company']) entityType!: 'contact' | 'deal' | 'company';
  @IsUUID() entityId!: string;
  value!: unknown;
}

@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFields: CustomFieldsService) {}

  @Get()
  @Permissions('custom-fields:read')
  list(@CurrentUser() user: AuthUser, @Query('entityType') entityType?: string) {
    return this.customFields.listDefinitions(user.tenantId, entityType);
  }

  @Post()
  @Permissions('custom-fields:write')
  @HttpCode(201)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFieldDto) {
    return this.customFields.createDefinition(user.tenantId, dto);
  }

  @Get('values')
  @Permissions('custom-fields:read')
  values(
    @CurrentUser() user: AuthUser,
    @Query('entityType') entityType: 'contact' | 'deal' | 'company',
    @Query('entityId') entityId: string,
  ) {
    return this.customFields.getValues(user.tenantId, entityType, entityId);
  }

  @Put('values')
  @Permissions('custom-fields:write')
  setValue(@CurrentUser() user: AuthUser, @Body() dto: SetValueDto) {
    return this.customFields.setValue(user.tenantId, dto.customFieldId, dto.entityType, dto.entityId, dto.value);
  }
}
