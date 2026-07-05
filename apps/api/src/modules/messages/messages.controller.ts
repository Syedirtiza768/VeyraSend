import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { MessagesService, type SendTransactionInput } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  @Permissions('messages:read')
  list(@CurrentUser() user: AuthUser) {
    return this.messages.list(user.tenantId);
  }

  @Get(':id')
  @Permissions('messages:read')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messages.getById(user.tenantId, id);
  }

  @Post('send')
  @Permissions('messages:write')
  send(@CurrentUser() user: AuthUser, @Body() input: SendTransactionInput) {
    return this.messages.send(user.tenantId, user.userId, input);
  }
}
