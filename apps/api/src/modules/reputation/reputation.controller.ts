import { Body, Controller, Get, Param, Patch, Post, Redirect } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { ReputationService } from './reputation.service';

class SendRequestDto {
  @IsUUID() contactId!: string;
  @IsIn(['email', 'sms']) channel!: 'email' | 'sms';
}

class TestimonialDto {
  @IsString() quote!: string;
  @IsString() name!: string;
}

class SettingsDto {
  @IsOptional() @IsString() googleReviewLink?: string | null;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TestimonialDto)
  widgetTestimonials?: TestimonialDto[];
}

@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputation: ReputationService) {}

  @Get('settings')
  @Permissions('reputation:read')
  getSettings(@CurrentUser() user: AuthUser) {
    return this.reputation.getSettings(user.tenantId);
  }

  @Patch('settings')
  @Permissions('reputation:write')
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: SettingsDto) {
    return this.reputation.updateSettings(user.tenantId, dto);
  }

  @Get('requests')
  @Permissions('reputation:read')
  listRequests(@CurrentUser() user: AuthUser) {
    return this.reputation.listRequests(user.tenantId);
  }

  @Post('requests')
  @Permissions('reputation:write')
  sendRequest(@CurrentUser() user: AuthUser, @Body() dto: SendRequestDto) {
    return this.reputation.sendRequest(user.tenantId, user.userId, dto.contactId, dto.channel);
  }

  @Get('r/:id')
  @Public()
  @Redirect('', 302)
  async redirect(@Param('id') id: string) {
    const url = await this.reputation.trackClick(id);
    return { url };
  }
}
