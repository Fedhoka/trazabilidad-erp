import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  RECEIVED = 'RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_orders')
export class PurchaseOrder extends TenantEntity {
  @Column()
  number: number;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus;

  @Column({ nullable: true })
  notes: string | null;
}
