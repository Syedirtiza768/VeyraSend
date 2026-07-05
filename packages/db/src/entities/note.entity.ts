import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { CrmEntityType } from './task.entity';

@Entity('notes')
@Index(['tenantId', 'entityType', 'entityId', 'createdAt'])
export class Note {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'text' }) body!: string;
  @Column({ type: 'uuid', name: 'author_user_id' }) authorUserId!: string;
  @Column({ type: 'varchar', name: 'entity_type', length: 20 }) entityType!: CrmEntityType;
  @Column({ type: 'uuid', name: 'entity_id' }) entityId!: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
