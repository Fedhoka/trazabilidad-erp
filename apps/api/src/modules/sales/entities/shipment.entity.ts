import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('shipments')
export class Shipment extends TenantEntity {
  @Column({ name: 'sales_order_id' })
  salesOrderId: string;

  @Column({ name: 'shipped_at', type: 'timestamptz' })
  shippedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
