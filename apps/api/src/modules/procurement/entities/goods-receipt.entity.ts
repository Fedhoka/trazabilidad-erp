import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('goods_receipts')
export class GoodsReceipt extends TenantEntity {
  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @Column({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Column({ nullable: true })
  notes: string | null;
}
