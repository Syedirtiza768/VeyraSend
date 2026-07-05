import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';
export type LifecycleStage = 'lead' | 'mql' | 'sql' | 'customer' | 'other';
export type SmsOptInStatus = 'unknown' | 'opted_in' | 'opted_out';

@Entity('contacts')
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'phone'])
@Index(['tenantId', 'companyId'])
@Index(['tenantId', 'ownerUserId'])
export class Contact {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'varchar', length: 255 }) email!: string;

  @Column({ type: 'varchar', length: 120, name: 'first_name', nullable: true }) firstName!: string | null;

  @Column({ type: 'varchar', length: 120, name: 'last_name', nullable: true }) lastName!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' }) status!: ContactStatus;

  /** Free-form custom fields, JSONB (legacy — prefer custom_field_values). */
  @Column({ type: 'jsonb', name: 'custom_fields', default: '{}' }) customFields!: Record<string, unknown>;

  @Column({ type: 'uuid', name: 'company_id', nullable: true }) companyId!: string | null;
  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true }) ownerUserId!: string | null;
  @Column({ type: 'varchar', name: 'lead_source', length: 120, nullable: true }) leadSource!: string | null;
  @Column({ type: 'varchar', name: 'lifecycle_stage', length: 20, default: 'lead' }) lifecycleStage!: LifecycleStage;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', name: 'sms_opt_in_status', length: 20, default: 'unknown' }) smsOptInStatus!: SmsOptInStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}
