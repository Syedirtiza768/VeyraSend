import { Controller, Get, Post, Patch, Body, Param, HttpCode, NotFoundException } from '@nestjs/common';
import { IsString, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';
import { UsersService } from './users.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../../common/auth.types';

class CreateUserDto {
  @IsEmail() @MaxLength(255)
  email!: string;

  @IsString() @MinLength(10) @MaxLength(256)
  password!: string;

  @IsOptional() @IsString() @MaxLength(120)
  name?: string | null;

  @IsString() @MinLength(2) @MaxLength(60)
  roleName!: string;
}

class UpdateUserDto {
  @IsString() @MinLength(2) @MaxLength(60)
  roleName!: string;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('users:read')
  async list(@CurrentUser() user: AuthUser) {
    return { data: await this.users.listForTenant(user.tenantId) };
  }

  @Get('roles')
  @Permissions('users:read')
  async roles(@CurrentUser() user: AuthUser) {
    return { data: await this.users.listRoles(user.tenantId) };
  }

  @Post()
  @Permissions('users:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    const created = await this.users.createUserInTenant({
      tenantId: user.tenantId,
      email: dto.email,
      password: dto.password,
      name: dto.name ?? null,
      roleName: dto.roleName,
    });
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'user.create',
      entityType: 'user',
      entityId: created.userId,
      detail: { email: created.email, roleName: created.roleName },
    });
    return { data: created };
  }

  @Patch(':id')
  @Permissions('users:write')
  async updateRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.users.updateMembershipRole({
      tenantId: user.tenantId,
      userId: id,
      roleName: dto.roleName,
    });
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'user.update_role',
      entityType: 'user',
      entityId: updated.userId,
      detail: { roleName: updated.roleName },
    });
    return { data: updated };
  }
}
