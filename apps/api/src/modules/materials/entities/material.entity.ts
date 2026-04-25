import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

export enum MaterialKind {
  RAW = 'RAW',
  PACKAGING = 'PACKAGING',
  WIP = 'WIP',
  FINISHED = 'FINISHED',
}

@Entity('materials')
export class Material extends TenantEntity {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'enum', enum: MaterialKind })
  kind: MaterialKind;

  @Column({ name: 'base_uom' })
  baseUom: string;

  @Column({ name: 'shelf_life_days', nullable: true })
  shelfLifeDays: number | null;

  @Column({ name: 'avg_cost', type: 'decimal', precision: 14, scale: 4, default: 0 })
  avgCost: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
