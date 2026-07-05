import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface SegmentRule {
  field: string; // 'email' | 'status' | 'list' | `custom:<key>`
  op: 'eq' | 'contains' | 'domain_eq' | 'ne';
  value: string;
}

export interface SegmentDefinition {
  combinator: 'and' | 'or';
  rules: SegmentRule[];
}

@Entity('segments')
@Index(['tenantId', 'name'], { unique: true })
export class Segment {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'varchar', length: 120 }) name!: string;

  @Column({ type: 'jsonb' }) definition!: SegmentDefinition;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
