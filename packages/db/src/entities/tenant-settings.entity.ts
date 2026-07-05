import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_settings')
@Index(['tenantId'], { unique: true })
export class TenantSettings {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  /** Optional per-tenant override for the SendGrid event webhook verification key. */
  @Column({ type: 'text', name: 'webhook_verification_key', nullable: true }) webhookVerificationKey!: string | null;
  /** Retention windows in days. The retention ticker hard-deletes rows older than these. */
  @Column({ type: 'int', name: 'event_retention_days', default: 90 }) eventRetentionDays!: number;
  @Column({ type: 'int', name: 'message_retention_days', default: 365 }) messageRetentionDays!: number;
  @Column({ type: 'int', name: 'inbound_retention_days', default: 90 }) inboundRetentionDays!: number;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
