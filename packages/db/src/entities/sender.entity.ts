import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Tenant-scoped single-sender verification record (mirrors SendGrid /senders).
 */
@Entity('senders')
@Index(['tenantId', 'fromEmail'], { unique: true })
export class Sender {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 255, name: 'sender_id' })
  senderId!: string;

  @Column({ type: 'varchar', length: 255, name: 'from_email' })
  fromEmail!: string;

  @Column({ type: 'varchar', length: 120, name: 'from_name', nullable: true })
  fromName!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'reply_to' })
  replyTo!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nickname!: string | null;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'varchar', length: 20, name: 'verification_status', default: 'pending' })
  verificationStatus!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
