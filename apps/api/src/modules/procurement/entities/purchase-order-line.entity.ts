import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_lines')
export class PurchaseOrderLine extends TenantEntity {
  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.lines)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 14, scale: 4 })
  unitPrice: number;

  @Column({ name: 'received_qty', type: 'decimal', precision: 14, scale: 4, default: 0 })
  receivedQty: number;
}
