import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { PhoneNumbersService } from './phone-numbers.service';

class PurchaseDto {
  @IsString() e164Number!: string;
  @IsOptional() @IsUUID() assignedUserId?: string | null;
}

class UpdatePhoneDto {
  @IsOptional() @IsUUID() assignedUserId?: string | null;
  @IsOptional() @IsString() forwardTo?: string | null;
}

@Controller('phone-numbers')
export class PhoneNumbersController {
  constructor(
    private readonly phones: PhoneNumbersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('phone-numbers:read')
  list(@CurrentUser() user: AuthUser) {
    return this.phones.list(user.tenantId);
  }

  @Get('search')
  @Permissions('phone-numbers:read')
  search(@CurrentUser() user: AuthUser, @Query('areaCode') areaCode?: string) {
    return this.phones.search(user.tenantId, areaCode);
  }

  @Post()
  @Permissions('phone-numbers:write')
  @HttpCode(201)
  async purchase(@CurrentUser() user: AuthUser, @Body() dto: PurchaseDto) {
    const row = await this.phones.purchase(user.tenantId, dto.e164Number, dto.assignedUserId);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'phone_number.purchase',
      entityType: 'phone_number', entityId: row.id, detail: { e164: row.e164Number },
    });
    return row;
  }

  @Patch(':id')
  @Permissions('phone-numbers:write')
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePhoneDto) {
    return this.phones.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('phone-numbers:delete')
  @HttpCode(204)
  async release(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.phones.release(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'phone_number.release',
      entityType: 'phone_number', entityId: id, detail: {},
    });
  }
}
