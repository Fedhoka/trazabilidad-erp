import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';
import { GoodsReceipt } from './goods-receipt.entity';

export enum QcStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

@Entity('goods_receipt_lines')
export class GoodsReceiptLine extends TenantEntity {
  @Column({ name: 'goods_receipt_id' })
  goodsReceiptId: string;

  @ManyToOne(() => GoodsReceipt, (gr) => gr.lines)
  @JoinColumn({ name: 'goods_receipt_id' })
  goodsReceipt: GoodsReceipt;

  @Column({ name: 'purchase_order_line_id' })
  purchaseOrderLineId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 14, scale: 4 })
  unitCost: number;

  @Column({ name: 'lot_code' })
  lotCode: string;

  @Column({ name: 'expires_on', type: 'date', nullable: true })
  expiresOn: Date | null;

  @Column({ type: 'enum', enum: QcStatus, default: QcStatus.PENDING })
  qcStatus: QcStatus;

  @Column({ name: 'qc_notes', nullable: true })
  qcNotes: string | null;

  @Column({ name: 'material_lot_id', nullable: true })
  materialLotId: string | null;
}
