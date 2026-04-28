import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';
import { LotStatus } from '../../inventory/entities/material-lot.entity';

@Entity('finished_lots')
export class FinishedLot extends TenantEntity {
  @Column({ name: 'lot_code' })
  lotCode: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ name: 'production_order_id' })
  productionOrderId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 14, scale: 4, default: 0 })
  unitCost: number;

  @Column({ type: 'enum', enum: LotStatus, default: LotStatus.AVAILABLE })
  status: LotStatus;

  @Column({ name: 'expires_on', type: 'date', nullable: true })
  expiresOn: Date | null;

  @Column({ name: 'location_id', type: 'text', nullable: true })
  locationId: string | null;
}
