import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type TenantType = 'direct' | 'agency' | 'sub_account';

export interface WhiteLabelConfig {
  logoUrl?: string | null;
  primaryColor?: string | null;
  productName?: string | null;
  supportEmail?: string | null;
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  slug!: string;

  @Column({ type: 'uuid', name: 'parent_tenant_id', nullable: true })
  @Index()
  parentTenantId!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'direct' })
  type!: TenantType;

  @Column({ type: 'jsonb', name: 'white_label_config', nullable: true })
  whiteLabelConfig!: WhiteLabelConfig | null;

  @Column({ type: 'uuid', name: 'billing_plan_id', nullable: true })
  billingPlanId!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt!: Date | null;
}
