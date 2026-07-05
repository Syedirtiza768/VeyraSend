import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { TagsService } from './tags.service';

class CreateTagDto {
  @IsString() @MaxLength(80) name!: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string | null;
}

@Controller('tags')
export class TagsController {
  constructor(
    private readonly tags: TagsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('tags:read')
  list(@CurrentUser() user: AuthUser) {
    return this.tags.list(user.tenantId);
  }

  @Post()
  @Permissions('tags:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTagDto) {
    const row = await this.tags.create(user.tenantId, dto.name, dto.color);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'tag.create',
      entityType: 'tag', entityId: row.id, detail: { name: row.name },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('tags:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.tags.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'tag.delete',
      entityType: 'tag', entityId: id, detail: {},
    });
  }
}
