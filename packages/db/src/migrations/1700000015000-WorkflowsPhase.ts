import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 15 — Workflow engine tables. */
export class WorkflowsPhase1700000015000 implements MigrationInterface {
  name = 'WorkflowsPhase1700000015000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "workflows" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "current_version_id" uuid NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await q.query(`CREATE INDEX idx_workflows_tenant_created ON "workflows" ("tenant_id", "created_at" DESC)`);

    await q.query(`
      CREATE TABLE "workflow_versions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "workflow_id" uuid NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
        "version" int NOT NULL,
        "definition" jsonb NOT NULL,
        "created_by_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT workflow_versions_workflow_version_unique UNIQUE (workflow_id, version)
      )
    `);
    await q.query(`CREATE INDEX idx_workflow_versions_tenant ON "workflow_versions" ("tenant_id")`);

    await q.query(`
      ALTER TABLE "workflows"
      ADD CONSTRAINT workflows_current_version_fk
      FOREIGN KEY ("current_version_id") REFERENCES "workflow_versions"("id") ON DELETE SET NULL
    `);

    await q.query(`
      CREATE TABLE "workflow_triggers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "workflow_id" uuid NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
        "workflow_version_id" uuid NOT NULL REFERENCES "workflow_versions"("id") ON DELETE CASCADE,
        "trigger_type" varchar(80) NOT NULL,
        "trigger_config" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_workflow_triggers_tenant_type ON "workflow_triggers" ("tenant_id", "trigger_type")`);

    await q.query(`
      CREATE TABLE "workflow_actions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "workflow_id" uuid NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
        "workflow_version_id" uuid NOT NULL REFERENCES "workflow_versions"("id") ON DELETE CASCADE,
        "action_type" varchar(80) NOT NULL,
        "position_in_graph" varchar(80) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "workflow_runs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "workflow_id" uuid NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
        "workflow_version_id" uuid NOT NULL REFERENCES "workflow_versions"("id") ON DELETE CASCADE,
        "contact_id" uuid NULL REFERENCES "contacts"("id") ON DELETE SET NULL,
        "trigger_payload" jsonb NOT NULL DEFAULT '{}',
        "status" varchar(20) NOT NULL DEFAULT 'running',
        "dry_run" boolean NOT NULL DEFAULT false,
        "started_at" timestamptz NOT NULL DEFAULT now(),
        "completed_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_workflow_runs_tenant_workflow_status ON "workflow_runs" ("tenant_id", "workflow_id", "status")`);
    await q.query(`CREATE INDEX idx_workflow_runs_tenant_contact ON "workflow_runs" ("tenant_id", "contact_id")`);

    await q.query(`
      CREATE TABLE "workflow_run_steps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "workflow_run_id" uuid NOT NULL REFERENCES "workflow_runs"("id") ON DELETE CASCADE,
        "node_id" varchar(80) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "attempt" int NOT NULL DEFAULT 1,
        "error" text NULL,
        "detail" jsonb NULL,
        "run_at" timestamptz NULL,
        "completed_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT workflow_run_steps_run_node_unique UNIQUE (tenant_id, workflow_run_id, node_id)
      )
    `);
    await q.query(`CREATE INDEX idx_workflow_run_steps_status_run_at ON "workflow_run_steps" ("status", "run_at")`);

    for (const table of ['workflows', 'workflow_versions', 'workflow_triggers', 'workflow_actions', 'workflow_runs', 'workflow_run_steps']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['workflow_run_steps', 'workflow_runs', 'workflow_actions', 'workflow_triggers', 'workflows', 'workflow_versions']) {
      await q.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }
}
