import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('points_of_sale')
export class PointOfSale extends TenantEntity {
  @Column({ type: 'smallint' })
  number: number;

  @Column()
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
