import {
  BadRequestException, ConflictException, Injectable, NotFoundException, Inject, forwardRef,
} from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { Appointment, Calendar } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { ContactsService } from '../contacts/contacts.service';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';
import { CalendarService } from './calendar.service';

export interface AppointmentRow {
  id: string;
  calendarId: string;
  contactId: string;
  assignedUserId: string | null;
  appointmentType: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  location: string | null;
  createdAt: string;
}

function toRow(a: Appointment): AppointmentRow {
  return {
    id: a.id,
    calendarId: a.calendarId,
    contactId: a.contactId,
    assignedUserId: a.assignedUserId,
    appointmentType: a.appointmentType,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status,
    location: a.location,
    createdAt: a.createdAt.toISOString(),
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly calendars: CalendarService,
    private readonly contacts: ContactsService,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  async list(tenantId: string): Promise<AppointmentRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Appointment).find({
      where: { tenantId: tid },
      order: { startsAt: 'DESC' },
      take: 200,
    });
    return rows.map(toRow);
  }

  async bookPublic(input: {
    calendarSlug: string;
    contactEmail: string;
    contactPhone?: string | null;
    startsAt: string;
    appointmentType?: string | null;
  }): Promise<AppointmentRow> {
    const cal = await this.calendars.findBySlug(input.calendarSlug);
    if (!cal) throw new NotFoundException('Calendar not found.');
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('startsAt must be a valid ISO datetime');

    const endsAt = new Date(startsAt.getTime() + cal.slotDurationMinutes * 60_000);
    await this.assertSlotFree(cal, startsAt, endsAt);

    const email = input.contactEmail.toLowerCase().trim();
    if (!email) throw new BadRequestException('contactEmail is required');
    const contactRow = await this.contacts.upsert(cal.tenantId, {
      email,
      phone: input.contactPhone ?? null,
      firstName: null,
      lastName: null,
    });

    const assignedUserId = await this.pickAssignee(cal);

    const appt = this.ds.getRepository(Appointment).create({
      tenantId: cal.tenantId,
      calendarId: cal.id,
      contactId: contactRow.id,
      assignedUserId,
      appointmentType: input.appointmentType ?? null,
      startsAt,
      endsAt,
      status: 'booked',
    });
    await this.ds.getRepository(Appointment).save(appt);

    await this.workflows.dispatch(cal.tenantId, 'appointment.booked', {
      contactId: contactRow.id,
      appointmentId: appt.id,
      calendarId: cal.id,
    }).catch(() => undefined);

    return toRow(appt);
  }

  async reschedule(tenantId: string, id: string, startsAt: string): Promise<AppointmentRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Appointment).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Appointment not found in this tenant.');
    const cal = await this.ds.getRepository(Calendar).findOne({ where: { id: row.calendarId, tenantId: tid } });
    if (!cal) throw new NotFoundException('Calendar not found.');
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + cal.slotDurationMinutes * 60_000);
    await this.assertSlotFree(cal, start, end, row.id);
    row.startsAt = start;
    row.endsAt = end;
    await this.ds.getRepository(Appointment).save(row);
    return toRow(row);
  }

  async cancel(tenantId: string, id: string): Promise<AppointmentRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Appointment).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Appointment not found in this tenant.');
    row.status = 'cancelled';
    await this.ds.getRepository(Appointment).save(row);
    return toRow(row);
  }

  async markNoShow(tenantId: string, id: string): Promise<AppointmentRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Appointment).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Appointment not found in this tenant.');
    row.status = 'no_show';
    await this.ds.getRepository(Appointment).save(row);
    return toRow(row);
  }

  private async assertSlotFree(cal: Calendar, startsAt: Date, endsAt: Date, excludeId?: string): Promise<void> {
    const existing = await this.ds.getRepository(Appointment).find({
      where: {
        tenantId: cal.tenantId,
        calendarId: cal.id,
        ...(excludeId ? { id: Not(excludeId) as never } : {}),
      },
    });
    for (const a of existing) {
      if (a.status === 'cancelled') continue;
      if (startsAt < a.endsAt && a.startsAt < endsAt) {
        throw new ConflictException('slot_unavailable');
      }
    }
  }

  private async pickAssignee(cal: Calendar): Promise<string | null> {
    const members = cal.memberUserIds?.length
      ? cal.memberUserIds
      : cal.ownerUserId
        ? [cal.ownerUserId]
        : [];
    if (members.length === 0) return null;
    if (members.length === 1) return members[0]!;

    const counts = await Promise.all(
      members.map(async (uid) => {
        const count = await this.ds.getRepository(Appointment).count({
          where: { tenantId: cal.tenantId, assignedUserId: uid, status: In(['booked', 'confirmed'] as never) },
        });
        return { uid, count };
      }),
    );
    counts.sort((a, b) => a.count - b.count);
    return counts[0]!.uid;
  }
}
