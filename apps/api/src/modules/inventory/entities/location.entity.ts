import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('locations')
export class Location extends TenantEntity {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
