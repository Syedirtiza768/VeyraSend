import { Controller, Get, Post, Body, HttpCode, ConflictException } from '@nestjs/common';
import { TenantsService, slugify } from './tenants.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../../common/auth.types';
import { IsString, MinLength, MaxLength } from 'class-validator';

class InstallDto {
  @IsString() @MinLength(2) @MaxLength(120)
  tenantName!: string;

  @IsString() @MinLength(2) @MaxLength(80)
  ownerName!: string;

  @IsString() @MinLength(3) @MaxLength(255)
  ownerEmail!: string;

  @IsString() @MinLength(10) @MaxLength(256)
  ownerPassword!: string;
}

@Controller()
export class TenantsController {
  constructor(
    private readonly tenants: TenantsService,
    private readonly audit: AuditService,
  ) {}

  /** Idempotent bootstrap: only allowed when zero tenants exist. */
  @Post('install')
  @Public()
  @HttpCode(201)
  async install(@Body() dto: InstallDto) {
    if ((await this.tenants.countTenants()) > 0) {
      throw new ConflictException('Already installed. Use login.');
    }
    const slug = slugify(dto.tenantName);
    const { tenant, owner } = await this.tenants.createTenantWithOwner({
      name: dto.tenantName,
      slug,
      ownerEmail: dto.ownerEmail,
      ownerPassword: dto.ownerPassword,
      ownerName: dto.ownerName,
    });
    await this.audit.record({
      tenantId: tenant.id,
      actorUserId: owner.id,
      action: 'install',
      entityType: 'tenant',
      entityId: tenant.id,
      detail: { tenantName: tenant.name, slug: tenant.slug, ownerEmail: owner.email },
    });
    return {
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      owner: { id: owner.id, email: owner.email, name: owner.name },
    };
  }

  @Get('tenants/current')
  @Permissions('tenants:read')
  async current(@CurrentUser() user: AuthUser) {
    const tenant = await this.tenants.getTenant(user.tenantId);
    return { id: tenant.id, name: tenant.name, slug: tenant.slug };
  }
}
