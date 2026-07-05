import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('billing_plans')
export class BillingPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'bigint', name: 'price_cents' })
  priceCents!: string;

  @Column({ type: 'varchar', length: 10, default: 'month' })
  interval!: 'month' | 'year';

  @Column({ type: 'jsonb', name: 'included_usage', default: '{}' })
  includedUsage!: Record<string, unknown>;

  @Column({ type: 'text', array: true, name: 'feature_flags', default: '{}' })
  featureFlags!: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('feature_flags')
@Index(['tenantId', 'key'], { unique: true, where: '"tenant_id" IS NOT NULL' })
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 80 })
  key!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
