import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('inbound_threads')
@Index(['tenantId', 'fromEmail'])
export class InboundThread {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'varchar', length: 255, name: 'from_email' }) fromEmail!: string;

  @Column({ type: 'varchar', length: 255, name: 'to_email' }) toEmail!: string;

  @Column({ type: 'varchar', length: 255 }) subject!: string;

  @Column({ type: 'int', name: 'message_count', default: 1 }) messageCount!: number;

  @Column({ type: 'timestamptz', name: 'last_inbound_at' }) lastInboundAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
