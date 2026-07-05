import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { CrmEntityType } from './task.entity';

export type CustomFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

@Entity('custom_fields')
@Index(['tenantId', 'entityType', 'key'], { unique: true })
export class CustomField {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'varchar', name: 'entity_type', length: 20 }) entityType!: CrmEntityType | 'deal';
  @Column({ type: 'varchar', length: 80 }) key!: string;
  @Column({ type: 'varchar', length: 120 }) label!: string;
  @Column({ type: 'varchar', name: 'field_type', length: 20 }) fieldType!: CustomFieldType;
  @Column({ type: 'jsonb', nullable: true }) options!: string[] | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('custom_field_values')
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'customFieldId'])
export class CustomFieldValue {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'uuid', name: 'custom_field_id' }) customFieldId!: string;
  @Column({ type: 'varchar', name: 'entity_type', length: 20 }) entityType!: CrmEntityType | 'deal';
  @Column({ type: 'uuid', name: 'entity_id' }) entityId!: string;
  @Column({ type: 'jsonb' }) value!: unknown;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
