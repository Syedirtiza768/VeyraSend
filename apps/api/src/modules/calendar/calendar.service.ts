import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Appointment, Calendar, type WeeklyAvailability } from '@veyrasend/db';
import { randomBytes } from 'crypto';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { computeAvailableSlots, slugifyBooking } from './slot-utils';

export interface CalendarRow {
  id: string;
  name: string;
  ownerUserId: string | null;
  timezone: string;
  availability: WeeklyAvailability;
  bookingSlug: string;
  memberUserIds: string[] | null;
  slotDurationMinutes: number;
  bufferMinutes: number;
  createdAt: string;
}

function toRow(c: Calendar): CalendarRow {
  return {
    id: c.id,
    name: c.name,
    ownerUserId: c.ownerUserId,
    timezone: c.timezone,
    availability: c.availability ?? {},
    bookingSlug: c.bookingSlug,
    memberUserIds: c.memberUserIds,
    slotDurationMinutes: c.slotDurationMinutes,
    bufferMinutes: c.bufferMinutes,
    createdAt: c.createdAt.toISOString(),
  };
}

@Injectable()
export class CalendarService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string): Promise<CalendarRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Calendar).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' } });
    return rows.map(toRow);
  }

  async create(tenantId: string, input: {
    name: string;
    ownerUserId?: string | null;
    timezone?: string;
    memberUserIds?: string[] | null;
    slotDurationMinutes?: number;
    bufferMinutes?: number;
  }): Promise<CalendarRow> {
    const tid = assertTenant(tenantId);
    const name = input.name.trim();
    if (!name) throw new BadRequestException('name is required');
    const base = slugifyBooking(name) || 'calendar';
    const bookingSlug = `${base}-${randomBytes(4).toString('hex')}`;
    const row = this.ds.getRepository(Calendar).create({
      tenantId: tid,
      name,
      ownerUserId: input.ownerUserId ?? null,
      timezone: input.timezone ?? 'America/New_York',
      availability: {},
      bookingSlug,
      memberUserIds: input.memberUserIds ?? null,
      slotDurationMinutes: input.slotDurationMinutes ?? 30,
      bufferMinutes: input.bufferMinutes ?? 15,
    });
    await this.ds.getRepository(Calendar).save(row);
    return toRow(row);
  }

  async setAvailability(tenantId: string, id: string, availability: WeeklyAvailability): Promise<CalendarRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Calendar).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Calendar not found in this tenant.');
    row.availability = availability;
    await this.ds.getRepository(Calendar).save(row);
    return toRow(row);
  }

  async findBySlug(slug: string): Promise<Calendar | null> {
    return this.ds.getRepository(Calendar).findOne({ where: { bookingSlug: slug } });
  }

  async publicSlots(slug: string, from: string, to: string): Promise<{ timezone: string; slots: Array<{ startsAt: string; endsAt: string }> }> {
    const cal = await this.findBySlug(slug);
    if (!cal) throw new NotFoundException('Calendar not found.');
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('from and to must be valid ISO dates');
    }
    const busyRows = await this.ds.getRepository(Appointment).find({
      where: { tenantId: cal.tenantId, calendarId: cal.id },
    });
    const busy = busyRows
      .filter((a) => a.status !== 'cancelled')
      .map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));
    const slots = computeAvailableSlots({
      availability: cal.availability ?? {},
      from: fromDate,
      to: toDate,
      slotDurationMinutes: cal.slotDurationMinutes,
      bufferMinutes: cal.bufferMinutes,
      busy,
    });
    return { timezone: cal.timezone, slots };
  }
}
