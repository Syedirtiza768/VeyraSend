import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Base for every business entity. All business entities carry a non-null
 * tenant_id (ADR-0002). Global tenant scoping is enforced in the API layer
 * and backed by DB row-level security; a missing tenant scope is a
 * build-breaking bug.
 *
 * Concrete entities extend this and add `@Column({ type: 'uuid', name:
 * 'tenant_id' })` plus `@Index()`. The column is declared on concrete classes
 * so TypeORM relations and RLS policies can be built per-table in migrations.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

/**
 * Marker interface for tenant-scoped entities. Implemented by adding a
 * `tenantId` column on the concrete class. Repository helpers use this to
 * refuse queries that lack a tenant filter.
 */
export interface TenantScoped {
  tenantId: string;
}
