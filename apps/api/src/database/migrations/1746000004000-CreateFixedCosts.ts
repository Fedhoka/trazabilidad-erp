import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFixedCosts1746000004000 implements MigrationInterface {
  name = 'CreateFixedCosts1746000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE fixed_costs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        category VARCHAR,
        amount DECIMAL(14,2) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_fixed_costs_tenant ON fixed_costs(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_fixed_costs_tenant_active ON fixed_costs(tenant_id, is_active)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fixed_costs_tenant_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_fixed_costs_tenant`);
    await queryRunner.query(`DROP TABLE IF EXISTS fixed_costs`);
  }
}
