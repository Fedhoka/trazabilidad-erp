import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1746000003000 implements MigrationInterface {
  name = 'CreateAuditLogs1746000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE audit_action_enum AS ENUM ('CREATE','UPDATE','DELETE')`);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id       UUID,
        user_email    VARCHAR,
        action        audit_action_enum NOT NULL,
        entity        VARCHAR       NOT NULL,
        entity_id     VARCHAR,
        metadata      JSONB,
        ip_address    VARCHAR,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_entity ON audit_logs(tenant_id, entity, entity_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_action_enum CASCADE`);
  }
}
