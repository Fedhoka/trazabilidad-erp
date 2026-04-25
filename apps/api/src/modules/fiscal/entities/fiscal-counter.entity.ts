import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';
import { InvoiceType } from './invoice.entity';

@Entity('fiscal_counters')
export class FiscalCounter extends TenantEntity {
  @Column({ name: 'point_of_sale_id' })
  pointOfSaleId: string;

  @Column({ name: 'invoice_type', type: 'enum', enum: InvoiceType })
  invoiceType: InvoiceType;

  @Column({ name: 'last_number', type: 'bigint', default: 0 })
  lastNumber: number;
}
