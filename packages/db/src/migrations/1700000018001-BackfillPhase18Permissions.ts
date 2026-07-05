import { MigrationInterface, QueryRunner } from 'typeorm';

const AGENCY_PERMS = [
  'agency:sub-accounts:read',
  'agency:sub-accounts:write',
  'agency:act-as',
  'agency:branding:read',
  'agency:branding:write',
  'agency:billing-plans:read',
  'agency:feature-flags:read',
  'agency:feature-flags:write',
];

function pgArray(values: string[]): string {
  return `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]::text[]`;
}

export class BackfillPhase18Permissions1700000018001 implements MigrationInterface {
  name = 'BackfillPhase18Permissions1700000018001';

  async up(q: QueryRunner): Promise<void> {
    for (const role of ['owner', 'admin']) {
      const rows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = '${role}' LIMIT 1`);
      if (!rows[0]) continue;
      const perms = [...new Set([...(rows[0].permissions ?? []), ...AGENCY_PERMS])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = '${role}'`);
    }
    const memberRows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = 'member' LIMIT 1`);
    if (memberRows[0]) {
      const readPerms = ['agency:sub-accounts:read', 'agency:branding:read', 'agency:billing-plans:read', 'agency:feature-flags:read'];
      const perms = [...new Set([...(memberRows[0].permissions ?? []), ...readPerms])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = 'member'`);
    }
  }

  async down(): Promise<void> {}
}
