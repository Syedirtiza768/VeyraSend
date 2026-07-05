import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills system role permissions for tenants created before Phase 2 added
 * the SendGrid/senders/domains permissions. Owner gets the full set; admin gets
 * senders/domains read+write. Idempotent.
 */
const OWNER_PERMS = [
  'users:read', 'users:write', 'users:delete', 'tenants:read', 'tenants:write', 'audit:read',
  'sendgrid:provision', 'senders:read', 'senders:write', 'domains:read', 'domains:write',
];
const ADMIN_PERMS = [
  'users:read', 'users:write', 'users:delete', 'tenants:read', 'audit:read',
  'senders:read', 'senders:write', 'domains:read', 'domains:write',
];

function pgArray(values: string[]): string {
  return `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]::text[]`;
}

export class BackfillRolePermissions1700000001001 implements MigrationInterface {
  name = 'BackfillRolePermissions1700000001001';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`UPDATE "roles" SET "permissions" = ${pgArray(OWNER_PERMS)} WHERE "is_system" = true AND "name" = 'owner'`);
    await q.query(`UPDATE "roles" SET "permissions" = ${pgArray(ADMIN_PERMS)} WHERE "is_system" = true AND "name" = 'admin'`);
  }

  async down(): Promise<void> {
    // No destructive down — permissions are additive.
  }
}
