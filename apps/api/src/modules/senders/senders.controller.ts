import { Controller, Get, Post, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { SendersService } from './senders.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../../common/auth.types';

class CreateSenderDto {
  @IsEmail() @MaxLength(255)
  fromEmail!: string;

  @IsOptional() @IsString() @MaxLength(120)
  fromName?: string;

  @IsEmail() @MaxLength(255)
  replyTo!: string;

  @IsOptional() @IsString() @MaxLength(120)
  nickname?: string;

  @IsString() @MinLength(2) @MaxLength(255)
  address!: string;

  @IsString() @MinLength(2) @MaxLength(120)
  city!: string;

  @IsString() @MinLength(2) @MaxLength(2)
  country!: string;

  @IsOptional() @IsString() @MaxLength(255)
  company?: string;
}

@Controller('senders')
export class SendersController {
  constructor(
    private readonly senders: SendersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('senders:read')
  async list(@CurrentUser() user: AuthUser) {
    return { data: await this.senders.list(user.tenantId) };
  }

  @Post()
  @Permissions('senders:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSenderDto) {
    const row = await this.senders.create(user.tenantId, dto);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'sender.create',
      entityType: 'sender',
      entityId: row.id,
      detail: { fromEmail: row.fromEmail },
    });
    return { data: row };
  }

  @Delete(':id')
  @Permissions('senders:write')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.senders.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'sender.delete',
      entityType: 'sender',
      entityId: id,
      detail: {},
    });
  }

  @Post(':id/resend-verification')
  @Permissions('senders:write')
  @HttpCode(204)
  async resend(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.senders.resendVerification(user.tenantId, id);
  }
}
