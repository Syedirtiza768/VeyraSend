import { Controller, Get, Post, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { DomainsService } from './domains.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../../common/auth.types';

class CreateDomainDto {
  @IsString() @MinLength(3) @MaxLength(253)
  domain!: string;
}

@Controller('domains')
export class DomainsController {
  constructor(
    private readonly domains: DomainsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('domains:read')
  async list(@CurrentUser() user: AuthUser) {
    return { data: await this.domains.list(user.tenantId) };
  }

  @Post()
  @Permissions('domains:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDomainDto) {
    const row = await this.domains.create(user.tenantId, dto.domain);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'domain.create',
      entityType: 'domain',
      entityId: row.id,
      detail: { domain: row.domain },
    });
    return { data: row };
  }

  @Get(':id/dns')
  @Permissions('domains:read')
  async dns(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.domains.getDns(user.tenantId, id);
  }

  @Post(':id/verify')
  @Permissions('domains:write')
  @HttpCode(200)
  async verify(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const res = await this.domains.verify(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'domain.verify',
      entityType: 'domain',
      entityId: id,
      detail: { verified: res.verified },
    });
    return res;
  }

  @Delete(':id')
  @Permissions('domains:write')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.domains.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'domain.delete',
      entityType: 'domain',
      entityId: id,
      detail: {},
    });
  }
}
