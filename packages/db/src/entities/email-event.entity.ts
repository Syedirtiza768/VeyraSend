import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('email_events')
@Index(['tenantId', 'createdAt'])
@Index(['sgMessageId'])
export class EmailEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  /** SendGrid event type: processed, delivered, bounce, deferred, open, click, unsubscribe, spamreport, etc. */
  @Column({ type: 'varchar', length: 40, name: 'event_type' }) eventType!: string;

  /** sg_message_id from the event payload. */
  @Column({ type: 'varchar', length: 255, name: 'sg_message_id', nullable: true }) sgMessageId!: string | null;

  /** sg_event_id — used for dedupe (unique). */
  @Column({ type: 'varchar', length: 160, name: 'sg_event_id', unique: true }) sgEventId!: string;

  /** Recipient email from the event payload. */
  @Column({ type: 'varchar', length: 255, name: 'recipient', nullable: true }) recipient!: string | null;

  /** SendGrid-reported event timestamp (epoch seconds). */
  @Column({ type: 'bigint', name: 'sg_timestamp', nullable: true }) sgTimestamp!: number | null;

  /** Raw event payload (JSONB). */
  @Column({ type: 'jsonb', name: 'raw' }) raw!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
