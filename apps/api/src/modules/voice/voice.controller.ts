import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { VoiceService } from './voice.service';

class InitiateCallDto {
  @IsUUID() contactId!: string;
  @IsUUID() fromNumberId!: string;
}

class DispositionDto {
  @IsString() disposition!: string;
}

@Controller('calls')
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Get()
  @Permissions('calls:read')
  list(@CurrentUser() user: AuthUser) {
    return this.voice.list(user.tenantId);
  }

  @Get(':id')
  @Permissions('calls:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.voice.getById(user.tenantId, id);
  }

  @Post()
  @Permissions('calls:write')
  @HttpCode(201)
  initiate(@CurrentUser() user: AuthUser, @Body() dto: InitiateCallDto) {
    return this.voice.initiateOutbound(user.tenantId, dto.contactId, dto.fromNumberId);
  }

  @Patch(':id/disposition')
  @Permissions('calls:write')
  disposition(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: DispositionDto) {
    return this.voice.setDisposition(user.tenantId, id, dto.disposition);
  }
}
