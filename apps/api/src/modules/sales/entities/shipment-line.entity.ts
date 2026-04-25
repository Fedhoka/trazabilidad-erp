import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('shipment_lines')
export class ShipmentLine extends TenantEntity {
  @Column({ name: 'shipment_id' })
  shipmentId: string;

  @Column({ name: 'sales_order_line_id' })
  salesOrderLineId: string;

  @Column({ name: 'finished_lot_id' })
  finishedLotId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;
}
