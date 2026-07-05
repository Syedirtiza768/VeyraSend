import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'deferred';

export type MessageKind = 'transactional' | 'campaign' | 'automation';

@Entity('messages')
@Index(['tenantId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  /** `transactional`, `campaign`, or `automation`. */
  @Column({ type: 'varchar', length: 20, default: 'transactional' }) kind!: MessageKind;

  /** Optional link to a campaign / automation step that produced this message. */
  @Column({ type: 'uuid', name: 'campaign_id', nullable: true }) campaignId!: string | null;

  /** From address used for the send. */
  @Column({ type: 'varchar', length: 255, name: 'from_email' }) fromEmail!: string;

  /** Recipient email. */
  @Column({ type: 'varchar', length: 255, name: 'to_email' }) @Index() toEmail!: string;

  @Column({ type: 'varchar', length: 255 }) subject!: string;

  @Column({ type: 'varchar', length: 40, default: 'queued' }) status!: MessageStatus;

  /** SendGrid message id (x-message-id / sg_message_id). */
  @Column({ type: 'varchar', length: 255, name: 'sg_message_id', nullable: true }) sgMessageId!: string | null;

  @Column({ type: 'uuid', name: 'conversation_id', nullable: true }) @Index() conversationId!: string | null;

  @Column({ type: 'uuid', name: 'call_id', nullable: true }) callId!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'email' }) channel!: 'email' | 'sms' | 'mms' | 'voice';
  @Column({ type: 'varchar', length: 20, default: 'outbound' }) direction!: 'inbound' | 'outbound';
  @Column({ type: 'varchar', name: 'provider_message_id', length: 255, nullable: true }) providerMessageId!: string | null;
  @Column({ type: 'varchar', name: 'from_phone', length: 40, nullable: true }) fromPhone!: string | null;
  @Column({ type: 'varchar', name: 'to_phone', length: 40, nullable: true }) toPhone!: string | null;
  @Column({ type: 'text', nullable: true }) body!: string | null;

  /** Idempotency key — prevents duplicate sends on retry. */
  @Column({ type: 'varchar', length: 120, name: 'idempotency_key' }) @Index() idempotencyKey!: string;

  /** Provider rejection reason, populated on failed/bounced. */
  @Column({ type: 'varchar', length: 255, name: 'reason', nullable: true }) reason!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
