import { MigrationInterface, QueryRunner } from 'typeorm';

const CRM_PERMS = [
  'companies:read', 'companies:write', 'companies:delete',
  'pipelines:read', 'pipelines:write', 'pipelines:delete',
  'deals:read', 'deals:write', 'deals:delete',
  'tasks:read', 'tasks:write', 'tasks:delete',
  'notes:read', 'notes:write', 'notes:delete',
  'tags:read', 'tags:write', 'tags:delete',
  'custom-fields:read', 'custom-fields:write', 'custom-fields:delete',
];

const CRM_READ = CRM_PERMS.filter((p) => p.endsWith(':read'));

function pgArray(values: string[]): string {
  return `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]::text[]`;
}

/** Phase 12 — add CRM permissions to system roles. Idempotent via full replace of known sets. */
export class BackfillCrmRolePermissions1700000012001 implements MigrationInterface {
  name = 'BackfillCrmRolePermissions1700000012001';

  async up(q: QueryRunner): Promise<void> {
    const ownerRows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = 'owner' LIMIT 1`);
    const adminRows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = 'admin' LIMIT 1`);
    const memberRows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = 'member' LIMIT 1`);

    const merge = (existing: string[], add: string[]) => [...new Set([...existing, ...add])];

    if (ownerRows[0]) {
      const perms = merge(ownerRows[0].permissions ?? [], CRM_PERMS);
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = 'owner'`);
    }
    if (adminRows[0]) {
      const perms = merge(adminRows[0].permissions ?? [], CRM_PERMS);
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = 'admin'`);
    }
    if (memberRows[0]) {
      const perms = merge(memberRows[0].permissions ?? [], CRM_READ);
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = 'member'`);
    }
  }

  async down(): Promise<void> {
    // Permissions are additive — no destructive down.
  }
}
