import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { IsIn, IsString, IsUUID } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { NotesService } from './notes.service';

class CreateNoteDto {
  @IsString() body!: string;
  @IsIn(['contact', 'deal', 'company']) entityType!: 'contact' | 'deal' | 'company';
  @IsUUID() entityId!: string;
}

@Controller('notes')
export class NotesController {
  constructor(
    private readonly notes: NotesService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('notes:read')
  list(
    @CurrentUser() user: AuthUser,
    @Query('entityType') entityType: 'contact' | 'deal' | 'company',
    @Query('entityId') entityId: string,
  ) {
    return this.notes.list(user.tenantId, entityType, entityId);
  }

  @Post()
  @Permissions('notes:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateNoteDto) {
    const row = await this.notes.create(user.tenantId, user.userId, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'note.create',
      entityType: dto.entityType, entityId: dto.entityId,
      detail: { noteId: row.id },
    });
    return row;
  }

  @Delete(':id')
  @Permissions('notes:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const row = await this.notes.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'note.delete',
      entityType: row.entityType, entityId: row.entityId,
      detail: { noteId: id, bodyPreview: row.body.slice(0, 80) },
    });
  }
}
