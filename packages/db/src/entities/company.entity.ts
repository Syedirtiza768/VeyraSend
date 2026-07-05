import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
@Index(['tenantId', 'name'])
@Index(['tenantId', 'domain'])
export class Company {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'varchar', length: 255 }) name!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) domain!: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) industry!: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone!: string | null;
  @Column({ type: 'jsonb', nullable: true }) address!: Record<string, unknown> | null;
  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true }) ownerUserId!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}
