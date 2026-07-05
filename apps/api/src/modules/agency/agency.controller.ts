import {
  Body, Controller, Get, HttpCode, Param, Patch, Post, Req,
} from '@nestjs/common';
import {
  IsBoolean, IsEmail, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength,
} from 'class-validator';
import type { Request } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AgencyService } from './agency.service';
import { FeatureFlagsService } from './feature-flags.service';
import { AuditService } from '../audit/audit.service';

class CreateSubAccountDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsEmail() ownerEmail!: string;
  @IsString() @MinLength(8) @MaxLength(256) ownerPassword!: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsUUID() billingPlanId?: string;
}

class BrandingDto {
  @IsOptional() @IsString() logoUrl?: string | null;
  @IsOptional() @IsString() primaryColor?: string | null;
  @IsOptional() @IsString() productName?: string | null;
  @IsOptional() @IsEmail() supportEmail?: string | null;
}

class FeatureFlagDto {
  @IsString() @MaxLength(80) key!: string;
  @IsBoolean() enabled!: boolean;
}

@Controller('agency')
export class AgencyController {
  constructor(
    private readonly agency: AgencyService,
    private readonly flags: FeatureFlagsService,
    private readonly audit: AuditService,
  ) {}

  @Get('sub-accounts')
  @Permissions('agency:sub-accounts:read')
  listSubAccounts(@CurrentUser() user: AuthUser) {
    return this.agency.listSubAccounts(user.actAs?.homeTenantId ?? user.tenantId);
  }

  @Post('sub-accounts')
  @Permissions('agency:sub-accounts:write')
  @HttpCode(201)
  createSubAccount(@CurrentUser() user: AuthUser, @Body() dto: CreateSubAccountDto) {
    const agencyId = user.actAs?.homeTenantId ?? user.tenantId;
    return this.agency.createSubAccount(agencyId, user.userId, dto);
  }

  @Post('sub-accounts/:id/act-as')
  @Permissions('agency:act-as')
  @HttpCode(200)
  async actAs(
    @CurrentUser() user: AuthUser,
    @Param('id') subAccountId: string,
    @Req() req: Request,
  ) {
    const agencyId = user.actAs?.homeTenantId ?? user.tenantId;
    const sub = await this.agency.validateActAs(agencyId, subAccountId);

    await this.audit.record({
      tenantId: sub.id,
      actorUserId: user.userId,
      action: 'agency.act_as.start',
      entityType: 'tenant',
      entityId: sub.id,
      detail: { agencyTenantId: agencyId, agencyUserId: user.userId },
    });

    req.session.homeTenantId = agencyId;
    req.session.actAsElevation = true;
    req.session.tenantId = sub.id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    return {
      ok: true,
      tenant: { id: sub.id, name: sub.name, slug: sub.slug },
      actAs: { homeTenantId: agencyId, subAccountId: sub.id, subAccountName: sub.name },
    };
  }

  @Post('act-as/return')
  @Permissions('agency:act-as')
  @HttpCode(200)
  async returnFromActAs(@CurrentUser() user: AuthUser, @Req() req: Request) {
    if (!user.actAs) {
      return { ok: true, alreadyHome: true };
    }

    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'agency.act_as.end',
      entityType: 'tenant',
      entityId: user.tenantId,
      detail: { agencyTenantId: user.actAs.homeTenantId, agencyUserId: user.userId },
    });

    req.session.tenantId = user.actAs.homeTenantId;
    delete req.session.homeTenantId;
    delete req.session.actAsElevation;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    return { ok: true, tenantId: user.actAs.homeTenantId };
  }

  @Get('branding')
  @Permissions('agency:branding:read')
  getBranding(@CurrentUser() user: AuthUser) {
    return this.agency.getBranding(user.actAs?.homeTenantId ?? user.tenantId);
  }

  @Patch('branding')
  @Permissions('agency:branding:write')
  updateBranding(@CurrentUser() user: AuthUser, @Body() dto: BrandingDto) {
    return this.agency.updateBranding(user.actAs?.homeTenantId ?? user.tenantId, user.userId, dto);
  }

  @Get('billing-plans')
  @Permissions('agency:billing-plans:read')
  listPlans() {
    return this.agency.listBillingPlans();
  }

  @Get('feature-flags')
  @Permissions('agency:feature-flags:read')
  listFlags(@CurrentUser() user: AuthUser) {
    return this.flags.listForTenant(user.tenantId);
  }

  @Patch('feature-flags')
  @Permissions('agency:feature-flags:write')
  setFlag(@CurrentUser() user: AuthUser, @Body() dto: FeatureFlagDto) {
    return this.flags.setTenantOverride(user.tenantId, dto.key, dto.enabled);
  }
}
