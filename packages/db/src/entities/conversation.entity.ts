import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('conversations')
@Index(['tenantId', 'contactId'], { unique: true })
@Index(['tenantId', 'lastMessageAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'uuid', name: 'contact_id' }) contactId!: string;

  @Column({ type: 'uuid', name: 'assigned_user_id', nullable: true }) assignedUserId!: string | null;

  @Column({ type: 'timestamptz', name: 'last_message_at' }) lastMessageAt!: Date;

  @Column({ type: 'boolean', default: true }) unread!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('conversation_notes')
@Index(['tenantId', 'conversationId', 'createdAt'])
export class ConversationNote {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'uuid', name: 'conversation_id' }) conversationId!: string;

  @Column({ type: 'uuid', name: 'author_user_id' }) authorUserId!: string;

  @Column({ type: 'text' }) body!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
