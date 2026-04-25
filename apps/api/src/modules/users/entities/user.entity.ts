import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum UserRole {
  OWNER = 'OWNER',
  PROCUREMENT = 'PROCUREMENT',
  PRODUCTION = 'PRODUCTION',
  QC = 'QC',
  SALES = 'SALES',
  FINANCE = 'FINANCE',
  OPERATOR = 'OPERATOR',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.OPERATOR })
  role: UserRole;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
