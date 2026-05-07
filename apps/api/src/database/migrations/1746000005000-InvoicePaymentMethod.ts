import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the payment_method enum and column to invoices, plus a back-fill
 * default ("OTHER") so existing rows remain valid. Indexed on
 * (tenant_id, payment_method) for the stats breakdown query.
 */
export class InvoicePaymentMethod1746000005000 implements MigrationInterface {
  name = 'InvoicePaymentMethod1746000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE payment_method_enum AS ENUM (
        'CASH',
        'BANK_TRANSFER',
        'DEBIT_CARD',
        'CREDIT_CARD',
        'MERCADOPAGO',
        'CHECK',
        'CURRENT_ACCOUNT',
        'OTHER'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE invoices
      ADD COLUMN payment_method payment_method_enum NOT NULL DEFAULT 'OTHER'
    `);
    await queryRunner.query(
      `CREATE INDEX idx_invoices_tenant_payment ON invoices(tenant_id, payment_method)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_invoices_tenant_type ON invoices(tenant_id, invoice_type)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_tenant_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_tenant_payment`);
    await queryRunner.query(`ALTER TABLE invoices DROP COLUMN IF EXISTS payment_method`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method_enum CASCADE`);
  }
}
