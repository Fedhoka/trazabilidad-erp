import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1714000000000 implements MigrationInterface {
  name = 'Init1714000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE user_role_enum AS ENUM ('OWNER','PROCUREMENT','PRODUCTION','QC','SALES','FINANCE','OPERATOR')`);
    await queryRunner.query(`CREATE TYPE material_kind_enum AS ENUM ('RAW','PACKAGING','WIP','FINISHED')`);
    await queryRunner.query(`CREATE TYPE lot_status_enum AS ENUM ('AVAILABLE','QUARANTINE','BLOCKED','CONSUMED','EXPIRED')`);
    await queryRunner.query(`CREATE TYPE purchase_order_status_enum AS ENUM ('DRAFT','APPROVED','RECEIVED','CLOSED','CANCELLED')`);
    await queryRunner.query(`CREATE TYPE qc_status_enum AS ENUM ('PASS','FAIL','PENDING')`);
    await queryRunner.query(`CREATE TYPE recipe_status_enum AS ENUM ('DRAFT','ACTIVE','ARCHIVED')`);
    await queryRunner.query(`CREATE TYPE production_order_status_enum AS ENUM ('DRAFT','IN_PROGRESS','COMPLETED','CANCELLED')`);
    await queryRunner.query(`CREATE TYPE condicion_iva_enum AS ENUM ('RI','CF','MONO','EXENTO')`);
    await queryRunner.query(`CREATE TYPE sales_order_status_enum AS ENUM ('DRAFT','CONFIRMED','SHIPPED','INVOICED','CANCELLED')`);

    await queryRunner.query(`
      CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        slug VARCHAR NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        password_hash VARCHAR NOT NULL,
        role user_role_enum NOT NULL DEFAULT 'OPERATOR',
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_tenant ON users(tenant_id)`);

    await queryRunner.query(`
      CREATE TABLE suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        cuit VARCHAR,
        address TEXT,
        contact_name VARCHAR,
        contact_email VARCHAR,
        contact_phone VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id)`);

    await queryRunner.query(`
      CREATE TABLE materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        code VARCHAR NOT NULL,
        kind material_kind_enum NOT NULL,
        base_uom VARCHAR NOT NULL,
        shelf_life_days INTEGER,
        avg_cost DECIMAL(14,4) NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_materials_tenant ON materials(tenant_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_materials_tenant_code ON materials(tenant_id, code)`);

    await queryRunner.query(`
      CREATE TABLE locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        code VARCHAR NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_locations_tenant ON locations(tenant_id)`);

    await queryRunner.query(`
      CREATE TABLE purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        supplier_id UUID NOT NULL REFERENCES suppliers(id),
        status purchase_order_status_enum NOT NULL DEFAULT 'DRAFT',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_purchase_orders_tenant_number ON purchase_orders(tenant_id, number)`);

    await queryRunner.query(`
      CREATE TABLE purchase_order_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        material_id UUID NOT NULL REFERENCES materials(id),
        quantity DECIMAL(14,4) NOT NULL,
        unit_price DECIMAL(14,4) NOT NULL,
        received_qty DECIMAL(14,4) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_pol_purchase_order ON purchase_order_lines(purchase_order_id)`);

    await queryRunner.query(`
      CREATE TABLE goods_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
        received_at TIMESTAMPTZ NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_goods_receipts_tenant ON goods_receipts(tenant_id)`);
    await queryRunner.query(`CREATE INDEX idx_goods_receipts_po ON goods_receipts(purchase_order_id)`);

    await queryRunner.query(`
      CREATE TABLE goods_receipt_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
        purchase_order_line_id UUID NOT NULL REFERENCES purchase_order_lines(id),
        material_id UUID NOT NULL REFERENCES materials(id),
        quantity DECIMAL(14,4) NOT NULL,
        unit_cost DECIMAL(14,4) NOT NULL,
        lot_code VARCHAR NOT NULL,
        expires_on DATE,
        qc_status qc_status_enum NOT NULL DEFAULT 'PENDING',
        qc_notes TEXT,
        material_lot_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_grl_receipt ON goods_receipt_lines(goods_receipt_id)`);

    await queryRunner.query(`
      CREATE TABLE material_lots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        lot_code VARCHAR NOT NULL,
        material_id UUID NOT NULL REFERENCES materials(id),
        supplier_id UUID REFERENCES suppliers(id),
        goods_receipt_line_id UUID REFERENCES goods_receipt_lines(id),
        quantity DECIMAL(14,4) NOT NULL,
        unit_cost DECIMAL(14,4) NOT NULL DEFAULT 0,
        status lot_status_enum NOT NULL DEFAULT 'AVAILABLE',
        location_id UUID REFERENCES locations(id),
        expires_on DATE,
        received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_material_lots_tenant ON material_lots(tenant_id)`);
    await queryRunner.query(`CREATE INDEX idx_material_lots_material ON material_lots(material_id)`);
    await queryRunner.query(`CREATE INDEX idx_material_lots_status ON material_lots(tenant_id, status)`);
    await queryRunner.query(`CREATE INDEX idx_material_lots_fefo ON material_lots(tenant_id, material_id, status, expires_on NULLS LAST, received_at)`);
    await queryRunner.query(`ALTER TABLE goods_receipt_lines ADD CONSTRAINT fk_grl_material_lot FOREIGN KEY (material_lot_id) REFERENCES material_lots(id)`);

    await queryRunner.query(`
      CREATE TABLE recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        output_material_id UUID NOT NULL REFERENCES materials(id),
        output_qty DECIMAL(14,4) NOT NULL,
        batch_size_uom VARCHAR NOT NULL,
        status recipe_status_enum NOT NULL DEFAULT 'DRAFT',
        version INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_recipes_tenant ON recipes(tenant_id)`);

    await queryRunner.query(`
      CREATE TABLE recipe_components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        material_id UUID NOT NULL REFERENCES materials(id),
        qty_per_batch DECIMAL(14,4) NOT NULL,
        loss_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_recipe_components_recipe ON recipe_components(recipe_id)`);

    await queryRunner.query(`
      CREATE TABLE production_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        recipe_id UUID NOT NULL REFERENCES recipes(id),
        output_material_id UUID NOT NULL REFERENCES materials(id),
        planned_qty DECIMAL(14,4) NOT NULL,
        actual_qty DECIMAL(14,4),
        status production_order_status_enum NOT NULL DEFAULT 'DRAFT',
        theoretical_cost DECIMAL(14,4),
        actual_cost DECIMAL(14,4),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_production_orders_tenant ON production_orders(tenant_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_production_orders_tenant_number ON production_orders(tenant_id, number)`);

    await queryRunner.query(`
      CREATE TABLE production_consumptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        production_order_id UUID NOT NULL REFERENCES production_orders(id),
        material_lot_id UUID NOT NULL REFERENCES material_lots(id),
        material_id UUID NOT NULL REFERENCES materials(id),
        quantity DECIMAL(14,4) NOT NULL,
        unit_cost DECIMAL(14,4) NOT NULL,
        consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_consumptions_production_order ON production_consumptions(production_order_id)`);
    await queryRunner.query(`CREATE INDEX idx_consumptions_lot ON production_consumptions(material_lot_id)`);

    await queryRunner.query(`
      CREATE TABLE finished_lots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        lot_code VARCHAR NOT NULL,
        material_id UUID NOT NULL REFERENCES materials(id),
        production_order_id UUID NOT NULL REFERENCES production_orders(id),
        quantity DECIMAL(14,4) NOT NULL,
        unit_cost DECIMAL(14,4) NOT NULL DEFAULT 0,
        status lot_status_enum NOT NULL DEFAULT 'AVAILABLE',
        expires_on DATE,
        location_id UUID REFERENCES locations(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_finished_lots_tenant ON finished_lots(tenant_id)`);
    await queryRunner.query(`CREATE INDEX idx_finished_lots_material ON finished_lots(material_id)`);

    await queryRunner.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        cuit VARCHAR,
        condicion_iva condicion_iva_enum NOT NULL,
        address TEXT,
        contact_name VARCHAR,
        contact_email VARCHAR,
        contact_phone VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_customers_tenant ON customers(tenant_id)`);

    await queryRunner.query(`
      CREATE TABLE sales_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        customer_id UUID NOT NULL REFERENCES customers(id),
        status sales_order_status_enum NOT NULL DEFAULT 'DRAFT',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sales_orders_tenant ON sales_orders(tenant_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_sales_orders_tenant_number ON sales_orders(tenant_id, number)`);

    await queryRunner.query(`
      CREATE TABLE sales_order_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
        material_id UUID NOT NULL REFERENCES materials(id),
        quantity DECIMAL(14,4) NOT NULL,
        unit_price DECIMAL(14,4) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sol_sales_order ON sales_order_lines(sales_order_id)`);

    await queryRunner.query(`
      CREATE TABLE shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
        shipped_at TIMESTAMPTZ NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_shipments_tenant ON shipments(tenant_id)`);
    await queryRunner.query(`CREATE INDEX idx_shipments_sales_order ON shipments(sales_order_id)`);

    await queryRunner.query(`
      CREATE TABLE shipment_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
        sales_order_line_id UUID NOT NULL REFERENCES sales_order_lines(id),
        finished_lot_id UUID NOT NULL REFERENCES finished_lots(id),
        quantity DECIMAL(14,4) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_shipment_lines_shipment ON shipment_lines(shipment_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS shipment_lines CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS shipments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_order_lines CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_orders CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS customers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS finished_lots CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS production_consumptions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS production_orders CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS recipe_components CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS recipes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS material_lots CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS goods_receipt_lines CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS goods_receipts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS purchase_order_lines CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS purchase_orders CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS locations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS materials CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS suppliers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenants CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS sales_order_status_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS condicion_iva_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS production_order_status_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS recipe_status_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS qc_status_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS purchase_order_status_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS lot_status_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS material_kind_enum CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum CASCADE`);
  }
}
