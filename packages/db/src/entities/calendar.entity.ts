import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type AppointmentStatus = 'booked' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface AvailabilityWindow {
  start: string;
  end: string;
}

export type WeeklyAvailability = Record<string, AvailabilityWindow[]>;

@Entity('calendars')
@Index(['tenantId'])
export class Calendar {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true }) ownerUserId!: string | null;
  @Column({ type: 'varchar', length: 60, default: 'America/New_York' }) timezone!: string;
  @Column({ type: 'jsonb', default: '{}' }) availability!: WeeklyAvailability;
  @Column({ type: 'varchar', name: 'booking_slug', length: 80, unique: true }) bookingSlug!: string;
  @Column('uuid', { name: 'member_user_ids', array: true, nullable: true }) memberUserIds!: string[] | null;
  @Column({ type: 'int', name: 'slot_duration_minutes', default: 30 }) slotDurationMinutes!: number;
  @Column({ type: 'int', name: 'buffer_minutes', default: 15 }) bufferMinutes!: number;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('appointments')
@Index(['tenantId', 'calendarId', 'startsAt'])
@Index(['tenantId', 'contactId'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'calendar_id' }) calendarId!: string;
  @Column({ type: 'uuid', name: 'contact_id' }) contactId!: string;
  @Column({ type: 'uuid', name: 'assigned_user_id', nullable: true }) assignedUserId!: string | null;
  @Column({ type: 'varchar', name: 'appointment_type', length: 80, nullable: true }) appointmentType!: string | null;
  @Column({ type: 'timestamptz', name: 'starts_at' }) startsAt!: Date;
  @Column({ type: 'timestamptz', name: 'ends_at' }) endsAt!: Date;
  @Column({ type: 'varchar', length: 20, default: 'booked' }) status!: AppointmentStatus;
  @Column({ type: 'varchar', length: 255, nullable: true }) location!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
