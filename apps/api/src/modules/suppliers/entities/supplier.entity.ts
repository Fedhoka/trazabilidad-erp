import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('suppliers')
export class Supplier extends TenantEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  cuit: string | null;

  @Column({ nullable: true })
  address: string | null;

  @Column({ name: 'contact_name', nullable: true })
  contactName: string | null;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
