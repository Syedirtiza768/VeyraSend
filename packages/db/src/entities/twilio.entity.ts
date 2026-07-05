import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_twilio_settings')
export class TenantTwilioSettings {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id', unique: true }) tenantId!: string;
  @Column({ type: 'varchar', name: 'twilio_subaccount_sid', length: 40 }) twilioSubaccountSid!: string;
  @Column({ type: 'text', name: 'encrypted_auth_token' }) encryptedAuthToken!: string;
  @Column({ type: 'varchar', name: 'messaging_service_sid', length: 40, nullable: true }) messagingServiceSid!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('phone_numbers')
@Index(['tenantId'])
export class PhoneNumber {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'varchar', name: 'twilio_sid', length: 40 }) twilioSid!: string;
  @Column({ type: 'varchar', name: 'e164_number', length: 20, unique: true }) e164Number!: string;
  @Column({ type: 'jsonb', default: '{}' }) capabilities!: { sms?: boolean; mms?: boolean; voice?: boolean };
  @Column({ type: 'uuid', name: 'assigned_user_id', nullable: true }) assignedUserId!: string | null;
  @Column({ type: 'varchar', length: 20, default: 'active' }) status!: string;
  @Column({ type: 'varchar', name: 'forward_to', length: 40, nullable: true }) forwardTo!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('calls')
@Index(['tenantId', 'contactId'])
@Index(['tenantId', 'twilioCallSid'])
export class Call {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'contact_id', nullable: true }) contactId!: string | null;
  @Column({ type: 'uuid', name: 'phone_number_id' }) phoneNumberId!: string;
  @Column({ type: 'varchar', length: 20 }) direction!: 'inbound' | 'outbound';
  @Column({ type: 'varchar', name: 'from_number', length: 40 }) fromNumber!: string;
  @Column({ type: 'varchar', name: 'to_number', length: 40 }) toNumber!: string;
  @Column({ type: 'varchar', length: 30, default: 'queued' }) status!: string;
  @Column({ type: 'int', name: 'duration_seconds', nullable: true }) durationSeconds!: number | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) disposition!: string | null;
  @Column({ type: 'varchar', name: 'twilio_call_sid', length: 40, nullable: true }) twilioCallSid!: string | null;
  @Column({ type: 'timestamptz', name: 'started_at', nullable: true }) startedAt!: Date | null;
  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true }) endedAt!: Date | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('call_recordings')
@Index(['tenantId', 'callId'])
export class CallRecording {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'call_id' }) callId!: string;
  @Column({ type: 'varchar', name: 'twilio_recording_sid', length: 40 }) twilioRecordingSid!: string;
  @Column({ type: 'varchar', length: 512 }) url!: string;
  @Column({ type: 'int', name: 'duration_seconds', nullable: true }) durationSeconds!: number | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('voicemail_messages')
@Index(['tenantId', 'callId'])
export class VoicemailMessage {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'call_id' }) callId!: string;
  @Column({ type: 'varchar', name: 'recording_url', length: 512 }) recordingUrl!: string;
  @Column({ type: 'text', nullable: true }) transcription!: string | null;
  @Column({ type: 'int', name: 'duration_seconds', nullable: true }) durationSeconds!: number | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('twilio_events')
@Index(['tenantId', 'resourceSid'])
export class TwilioEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'varchar', name: 'event_type', length: 60 }) eventType!: string;
  @Column({ type: 'varchar', name: 'resource_sid', length: 40 }) resourceSid!: string;
  @Column({ type: 'varchar', name: 'twilio_event_id', length: 80, nullable: true }) twilioEventId!: string | null;
  @Column({ type: 'jsonb' }) raw!: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('usage_records')
@Index(['tenantId', 'periodStart', 'provider', 'metric'], { unique: true })
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'date', name: 'period_start' }) periodStart!: string;
  @Column({ type: 'date', name: 'period_end' }) periodEnd!: string;
  @Column({ type: 'varchar', length: 20 }) provider!: string;
  @Column({ type: 'varchar', length: 40 }) metric!: string;
  @Column({ type: 'bigint', default: '0' }) quantity!: string;
  @Column({ type: 'bigint', name: 'cost_micros', nullable: true }) costMicros!: string | null;
  @Column({ type: 'bigint', name: 'billed_micros', nullable: true }) billedMicros!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
