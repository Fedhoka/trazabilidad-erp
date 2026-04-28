import { Column, Entity, OneToMany } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';
import { GoodsReceiptLine } from './goods-receipt-line.entity';

@Entity('goods_receipts')
export class GoodsReceipt extends TenantEntity {
  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @Column({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => GoodsReceiptLine, (l) => l.goodsReceipt)
  lines: GoodsReceiptLine[];
}
