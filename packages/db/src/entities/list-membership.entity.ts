import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('list_memberships')
@Index(['tenantId', 'listId', 'contactId'], { unique: true })
export class ListMembership {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'uuid', name: 'list_id' }) @Index() listId!: string;

  @Column({ type: 'uuid', name: 'contact_id' }) @Index() contactId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
