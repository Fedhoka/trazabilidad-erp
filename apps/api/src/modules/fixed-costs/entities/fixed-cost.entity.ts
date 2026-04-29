import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('fixed_costs')
export class FixedCost extends TenantEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  category: string | null;

  /**
   * Monthly amount in ARS. Returned as a string by node-postgres for the
   * decimal type — controllers/clients should coerce as needed.
   */
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
