import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('production_consumptions')
export class ProductionConsumption extends TenantEntity {
  @Column({ name: 'production_order_id' })
  productionOrderId: string;

  @Column({ name: 'material_lot_id' })
  materialLotId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 14, scale: 4 })
  unitCost: number;

  @Column({ name: 'consumed_at', type: 'timestamptz', default: () => 'now()' })
  consumedAt: Date;
}
