import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

export enum CondicionIva {
  RI = 'RI',
  CF = 'CF',
  MONO = 'MONO',
  EXENTO = 'EXENTO',
}

@Entity('customers')
export class Customer extends TenantEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  cuit: string | null;

  @Column({ name: 'condicion_iva', type: 'enum', enum: CondicionIva })
  condicionIva: CondicionIva;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'contact_name', type: 'text', nullable: true })
  contactName: string | null;

  @Column({ name: 'contact_email', type: 'text', nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'text', nullable: true })
  contactPhone: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
