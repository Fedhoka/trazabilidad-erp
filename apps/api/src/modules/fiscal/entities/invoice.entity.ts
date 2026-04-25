import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

export enum InvoiceType {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  AUTHORIZED = 'AUTHORIZED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('invoices')
export class Invoice extends TenantEntity {
  @Column({ name: 'point_of_sale_id' })
  pointOfSaleId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'sales_order_id', nullable: true })
  salesOrderId: string | null;

  @Column({ name: 'invoice_type', type: 'enum', enum: InvoiceType })
  invoiceType: InvoiceType;

  @Column({ name: 'invoice_number', type: 'bigint', default: 0 })
  invoiceNumber: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  netAmount: number;

  @Column({ name: 'iva_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  ivaAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ nullable: true })
  cae: string | null;

  @Column({ name: 'cae_expires_on', type: 'date', nullable: true })
  caeExpiresOn: Date | null;

  @Column({ name: 'afip_request', type: 'jsonb', nullable: true })
  afipRequest: object | null;

  @Column({ name: 'afip_response', type: 'jsonb', nullable: true })
  afipResponse: object | null;

  @Column({ name: 'issued_at', type: 'timestamptz', nullable: true })
  issuedAt: Date | null;
}
