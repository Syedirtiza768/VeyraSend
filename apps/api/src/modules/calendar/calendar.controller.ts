import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { IsArray, IsInt, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { PublicRateLimitService, assertRateLimit } from '../../common/public-rate-limit.service';
import { CalendarService } from './calendar.service';
import { AppointmentsService } from './appointments.service';

class CreateCalendarDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsUUID() ownerUserId?: string | null;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsArray() @IsUUID(undefined, { each: true }) memberUserIds?: string[];
  @IsOptional() @IsInt() @Min(5) slotDurationMinutes?: number;
  @IsOptional() @IsInt() @Min(0) bufferMinutes?: number;
}

class AvailabilityDto {
  @IsObject() availability!: Record<string, Array<{ start: string; end: string }>>;
}

class BookDto {
  @IsString() calendarSlug!: string;
  @IsString() contactEmail!: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsString() startsAt!: string;
  @IsOptional() @IsString() appointmentType?: string;
}

class RescheduleDto {
  @IsString() startsAt!: string;
}

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendars: CalendarService,
    private readonly rateLimit: PublicRateLimitService,
  ) {}

  @Get()
  @Permissions('calendar:read')
  list(@CurrentUser() user: AuthUser) {
    return this.calendars.list(user.tenantId);
  }

  @Post()
  @Permissions('calendar:write')
  @HttpCode(201)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCalendarDto) {
    return this.calendars.create(user.tenantId, dto);
  }

  @Patch(':id/availability')
  @Permissions('calendar:write')
  setAvailability(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AvailabilityDto) {
    return this.calendars.setAvailability(user.tenantId, id, dto.availability);
  }

  @Get(':slug/public-slots')
  @Public()
  publicSlots(
    @Param('slug') slug: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: Request,
  ) {
    assertRateLimit(this.rateLimit, `slots:${req.ip}:${slug}`, 60, 60_000);
    return this.calendars.publicSlots(slug, from, to);
  }
}

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly rateLimit: PublicRateLimitService,
  ) {}

  @Post()
  @Public()
  @SkipCsrf()
  @HttpCode(201)
  book(@Body() dto: BookDto, @Req() req: Request) {
    assertRateLimit(this.rateLimit, `book:${req.ip}`, 10, 60_000);
    return this.appointments.bookPublic(dto);
  }

  @Get()
  @Permissions('appointments:read')
  list(@CurrentUser() user: AuthUser) {
    return this.appointments.list(user.tenantId);
  }

  @Post(':id/reschedule')
  @Permissions('appointments:write')
  reschedule(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.appointments.reschedule(user.tenantId, id, dto.startsAt);
  }

  @Post(':id/cancel')
  @Permissions('appointments:write')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointments.cancel(user.tenantId, id);
  }

  @Post(':id/no-show')
  @Permissions('appointments:write')
  noShow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointments.markNoShow(user.tenantId, id);
  }
}
