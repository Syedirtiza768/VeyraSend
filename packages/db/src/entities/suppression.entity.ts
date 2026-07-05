import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type SuppressionReason = 'unsubscribe' | 'bounce' | 'complaint' | 'manual';

@Entity('suppressions')
@Index(['tenantId', 'email', 'reason'], { unique: true })
export class Suppression {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'varchar', length: 255 }) email!: string;

  @Column({ type: 'varchar', length: 20 }) reason!: SuppressionReason;

  @Column({ type: 'varchar', length: 40, name: 'source', default: 'manual' }) source!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
