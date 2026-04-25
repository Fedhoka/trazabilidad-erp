import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('invoice_lines')
export class InvoiceLine extends TenantEntity {
  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 14, scale: 4 })
  unitPrice: number;

  @Column({ name: 'iva_rate', type: 'decimal', precision: 5, scale: 2, default: 21 })
  ivaRate: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 14, scale: 2 })
  netAmount: number;

  @Column({ name: 'iva_amount', type: 'decimal', precision: 14, scale: 2 })
  ivaAmount: number;
}
