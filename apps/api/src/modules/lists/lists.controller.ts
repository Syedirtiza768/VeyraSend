import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { ListsService } from './lists.service';

class CreateListDto {
  @IsString() @MaxLength(120)
  name!: string;
}

class ListContactDto {
  @IsString()
  contactId!: string;
}

@Controller('lists')
export class ListsController {
  constructor(
    private readonly lists: ListsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('lists:read')
  list(@CurrentUser() user: AuthUser) {
    return this.lists.list(user.tenantId);
  }

  @Post()
  @Permissions('lists:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateListDto) {
    const row = await this.lists.create(user.tenantId, dto.name);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'list.create',
      entityType: 'list',
      entityId: row.id,
      detail: { name: row.name },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('lists:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.lists.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.userId,
      action: 'list.delete',
      entityType: 'list',
      entityId: id,
      detail: {},
    });
  }

  @Get(':id/members')
  @Permissions('lists:read')
  members(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.lists.members(user.tenantId, id);
  }

  @Post(':id/members')
  @Permissions('lists:write')
  @HttpCode(204)
  async addMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ListContactDto) {
    await this.lists.addContact(user.tenantId, id, dto.contactId);
  }

  @Delete(':id/members/:contactId')
  @Permissions('lists:write')
  @HttpCode(204)
  async removeMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('contactId') contactId: string) {
    await this.lists.removeContact(user.tenantId, id, contactId);
  }
}
