import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

export enum LotStatus {
  AVAILABLE = 'AVAILABLE',
  QUARANTINE = 'QUARANTINE',
  BLOCKED = 'BLOCKED',
  CONSUMED = 'CONSUMED',
  EXPIRED = 'EXPIRED',
}

@Entity('material_lots')
export class MaterialLot extends TenantEntity {
  @Column({ name: 'lot_code' })
  lotCode: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string | null;

  @Column({ name: 'goods_receipt_line_id', nullable: true })
  goodsReceiptLineId: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 14, scale: 4, default: 0 })
  unitCost: number;

  @Column({ type: 'enum', enum: LotStatus, default: LotStatus.AVAILABLE })
  status: LotStatus;

  @Column({ name: 'location_id', nullable: true })
  locationId: string | null;

  @Column({ name: 'expires_on', type: 'date', nullable: true })
  expiresOn: Date | null;

  @Column({ name: 'received_at', type: 'timestamptz', default: () => 'now()' })
  receivedAt: Date;
}
