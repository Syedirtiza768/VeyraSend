import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tags')
@Index(['tenantId', 'name'], { unique: true })
export class Tag {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'varchar', length: 80 }) name!: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) color!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('contact_tags')
@Index(['tenantId', 'tagId'])
export class ContactTag {
  @Column({ type: 'uuid', name: 'tenant_id', primary: true }) tenantId!: string;
  @Column({ type: 'uuid', name: 'contact_id', primary: true }) contactId!: string;
  @Column({ type: 'uuid', name: 'tag_id', primary: true }) tagId!: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
