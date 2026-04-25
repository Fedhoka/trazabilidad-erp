import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED',
}

@Entity('sales_orders')
export class SalesOrder extends TenantEntity {
  @Column()
  number: number;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'enum', enum: SalesOrderStatus, default: SalesOrderStatus.DRAFT })
  status: SalesOrderStatus;

  @Column({ nullable: true })
  notes: string | null;
}
