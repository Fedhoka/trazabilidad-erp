import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('sales_order_lines')
export class SalesOrderLine extends TenantEntity {
  @Column({ name: 'sales_order_id' })
  salesOrderId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 14, scale: 4 })
  unitPrice: number;
}
