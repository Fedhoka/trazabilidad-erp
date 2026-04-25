import { MigrationInterface, QueryRunner } from 'typeorm';

export class PointsOfSaleAndCounters1714000100000 implements MigrationInterface {
  name = 'PointsOfSaleAndCounters1714000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE invoice_type_enum AS ENUM ('A','B','C')`);
    await queryRunner.query(`CREATE TYPE invoice_status_enum AS ENUM ('DRAFT','AUTHORIZED','REJECTED','CANCELLED')`);

    await queryRunner.query(`
      CREATE TABLE points_of_sale (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        number SMALLINT NOT NULL,
        name VARCHAR NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_pos_tenant_number ON points_of_sale(tenant_id, number)`);

    await queryRunner.query(`
      CREATE TABLE fiscal_counters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        point_of_sale_id UUID NOT NULL REFERENCES points_of_sale(id),
        invoice_type invoice_type_enum NOT NULL,
        last_number BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, point_of_sale_id, invoice_type)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        point_of_sale_id UUID NOT NULL REFERENCES points_of_sale(id),
        customer_id UUID NOT NULL REFERENCES customers(id),
        sales_order_id UUID REFERENCES sales_orders(id),
        invoice_type invoice_type_enum NOT NULL,
        invoice_number BIGINT NOT NULL DEFAULT 0,
        net_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
        iva_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
        status invoice_status_enum NOT NULL DEFAULT 'DRAFT',
        cae VARCHAR,
        cae_expires_on DATE,
        afip_request JSONB,
        afip_response JSONB,
        issued_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_invoices_tenant ON invoices(tenant_id)`);
    await queryRunner.query(`CREATE INDEX idx_invoices_customer ON invoices(customer_id)`);

    await queryRunner.query(`
      CREATE TABLE invoice_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        description VARCHAR NOT NULL,
        quantity DECIMAL(14,4) NOT NULL,
        unit_price DECIMAL(14,4) NOT NULL,
        iva_rate DECIMAL(5,2) NOT NULL DEFAULT 21,
        net_amount DECIMAL(14,2) NOT NULL,
        iva_amount DECIMAL(14,2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS invoice_lines CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS invoices CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS fiscal_counters CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS points_of_sale CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS invoice_status_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS invoice_type_enum CASCADE`);
  }
}
