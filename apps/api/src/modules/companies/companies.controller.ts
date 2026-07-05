import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from './companies.service';

class CompanyDto {
  @IsString() @MaxLength(255)
  name!: string;

  @IsOptional() @IsString() @MaxLength(255)
  domain?: string | null;

  @IsOptional() @IsString() @MaxLength(120)
  industry?: string | null;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string | null;

  @IsOptional() @IsObject()
  address?: Record<string, unknown> | null;

  @IsOptional() @IsUUID()
  ownerUserId?: string | null;
}

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companies: CompaniesService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('companies:read')
  list(@CurrentUser() user: AuthUser, @Query('q') q?: string, @Query('ownerUserId') ownerUserId?: string) {
    return this.companies.list(user.tenantId, q, ownerUserId);
  }

  @Get(':id')
  @Permissions('companies:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.companies.getById(user.tenantId, id);
  }

  @Post()
  @Permissions('companies:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CompanyDto) {
    const row = await this.companies.create(user.tenantId, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'company.create',
      entityType: 'company', entityId: row.id, detail: { name: row.name },
    });
    return row;
  }

  @Patch(':id')
  @Permissions('companies:write')
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: Partial<CompanyDto>) {
    const row = await this.companies.update(user.tenantId, id, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'company.update',
      entityType: 'company', entityId: id, detail: {},
    });
    return row;
  }

  @Delete(':id')
  @Permissions('companies:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.companies.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'company.delete',
      entityType: 'company', entityId: id, detail: {},
    });
  }
}
