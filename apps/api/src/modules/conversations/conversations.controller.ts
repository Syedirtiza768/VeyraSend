import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID, MinLength, ValidateIf } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { ConversationsService } from './conversations.service';

class SendMessageDto {
  @IsString() @MinLength(1) body!: string;
  @IsOptional() @IsIn(['email', 'sms', 'mms']) channel?: string;
}

class AssignDto {
  @ValidateIf((o) => o.userId != null)
  @IsUUID()
  userId!: string | null;
}

class NoteDto {
  @IsString() @MinLength(1) body!: string;
}

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  @Permissions('conversations:read')
  list(
    @CurrentUser() user: AuthUser,
    @Query('channel') channel?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversations.list(user.tenantId, {
      channel,
      assignedUserId,
      unread,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Permissions('conversations:read')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.conversations.getById(user.tenantId, id);
  }

  @Get(':id/messages')
  @Permissions('conversations:read')
  messages(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.conversations.getMessages(user.tenantId, id, limit ? Number(limit) : 50);
  }

  @Post(':id/messages')
  @Permissions('conversations:write')
  send(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.conversations.sendReply(user.tenantId, id, user.userId, dto);
  }

  @Post(':id/assign')
  @Permissions('conversations:write')
  assign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AssignDto) {
    return this.conversations.assign(user.tenantId, id, dto.userId ?? null);
  }

  @Post(':id/read')
  @Permissions('conversations:write')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.conversations.markRead(user.tenantId, id);
  }

  @Post(':id/notes')
  @Permissions('conversations:write')
  addNote(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: NoteDto) {
    return this.conversations.addNote(user.tenantId, id, user.userId, dto.body);
  }
}
