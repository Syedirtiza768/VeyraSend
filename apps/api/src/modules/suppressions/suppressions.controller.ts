import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { SuppressionsService } from './suppressions.service';

class AddSuppressionDto {
  @IsEmail() @MaxLength(255)
  email!: string;

  @IsIn(['unsubscribe', 'bounce', 'complaint', 'manual'])
  reason!: 'unsubscribe' | 'bounce' | 'complaint' | 'manual';

  @IsOptional() @IsString() @MaxLength(40)
  source?: string;
}

@Controller('suppressions')
export class SuppressionsController {
  constructor(
    private readonly suppressions: SuppressionsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('suppressions:read')
  list(@CurrentUser() user: AuthUser) {
    return this.suppressions.list(user.tenantId);
  }

  @Post()
  @Permissions('suppressions:write')
  @HttpCode(201)
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddSuppressionDto) {
    const row = await this.suppressions.add(user.tenantId, dto.email, dto.reason, dto.source ?? 'manual');
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'suppression.add',
      entityType: 'suppression',
      entityId: row.id,
      detail: { email: row.email, reason: row.reason },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('suppressions:write')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.suppressions.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'suppression.remove',
      entityType: 'suppression',
      entityId: id,
      detail: {},
    });
  }
}
