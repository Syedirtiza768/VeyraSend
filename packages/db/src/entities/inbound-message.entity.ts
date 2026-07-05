import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export interface InboundAttachment {
  filename: string;
  type: string;
  size: number;
  url?: string;
}

@Entity('inbound_messages')
@Index(['tenantId', 'threadId'])
export class InboundMessage {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'uuid', name: 'thread_id' }) @Index() threadId!: string;

  @Column({ type: 'varchar', length: 255, name: 'from_email' }) fromEmail!: string;

  @Column({ type: 'varchar', length: 255, name: 'to_email' }) toEmail!: string;

  @Column({ type: 'varchar', length: 255 }) subject!: string;

  @Column({ type: 'text', nullable: true }) text!: string | null;

  @Column({ type: 'text', nullable: true }) html!: string | null;

  @Column({ type: 'jsonb', nullable: true }) attachments!: InboundAttachment[] | null;

  @Column({ type: 'timestamptz', name: 'received_at' }) receivedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
