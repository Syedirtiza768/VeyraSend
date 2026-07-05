import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  UnauthorizedException,
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength, IsOptional } from 'class-validator';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../../common/auth.types';

class LoginDto {
  @IsEmail() @MaxLength(255)
  email!: string;

  @IsString() @MinLength(1) @MaxLength(256)
  password!: string;

  @IsOptional() @IsString() @MaxLength(80)
  tenantSlug?: string;
}

function setSession(req: Request, data: { userId: string; tenantId: string; roleId: string }) {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = data.userId;
      req.session.tenantId = data.tenantId;
      req.session.roleId = data.roleId;
      req.session.save((err2) => (err2 ? reject(err2) : resolve()));
    });
  });
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly audit: AuditService,
  ) {}

  @Get('csrf')
  @Public()
  csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = randomUUID();
    res.cookie('csrf', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: req.protocol === 'https',
      path: '/',
    });
    return { token };
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.findUserByEmail(dto.email);
    if (!user || !(await this.auth.verifyPassword(user, dto.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const memberships = await this.auth.loadMemberships(user.id);
    if (memberships.length === 0) {
      throw new UnauthorizedException('User has no tenant memberships.');
    }
    const chosen = dto.tenantSlug
      ? memberships.find((m) => m.tenantSlug === dto.tenantSlug)
      : memberships[0];
    if (!chosen) {
      throw new BadRequestException(`No membership for tenant '${dto.tenantSlug}'.`);
    }

    await setSession(req, { userId: user.id, tenantId: chosen.tenantId, roleId: chosen.roleId });

    // Issue a CSRF token cookie alongside the new session.
    const csrfToken = randomUUID();
    res.cookie('csrf', csrfToken, {
      httpOnly: false,
      sameSite: 'lax',
      secure: req.protocol === 'https',
      path: '/',
    });

    await this.audit.record({
      tenantId: chosen.tenantId,
      actorUserId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      detail: { email: user.email, tenantSlug: chosen.tenantSlug },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { id: chosen.tenantId, name: chosen.tenantName, slug: chosen.tenantSlug },
      role: { id: chosen.roleId, name: chosen.roleName },
      permissions: chosen.permissions,
      memberships: memberships.map((m) => ({
        tenantId: m.tenantId,
        tenantName: m.tenantName,
        tenantSlug: m.tenantSlug,
        roleName: m.roleName,
      })),
      csrfToken,
    };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @CurrentUser() user: AuthUser | undefined) {
    if (user) {
      await this.audit.record({
        tenantId: user.tenantId,
        actorUserId: user.userId,
        action: 'auth.logout',
        entityType: 'user',
        entityId: user.userId,
        detail: {},
      });
    }
    await new Promise<void>((resolve) => {
      req.session.destroy(() => resolve());
    });
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return {
      user: { id: user.userId, email: user.email, name: user.name },
      tenant: { id: user.tenantId },
      role: { id: user.roleId, name: user.roleName },
      permissions: user.permissions,
      actAs: user.actAs ?? null,
    };
  }
}
