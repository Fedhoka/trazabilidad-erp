import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

export enum ProductionOrderStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('production_orders')
export class ProductionOrder extends TenantEntity {
  @Column()
  number: number;

  @Column({ name: 'recipe_id' })
  recipeId: string;

  @Column({ name: 'output_material_id' })
  outputMaterialId: string;

  @Column({ name: 'planned_qty', type: 'decimal', precision: 14, scale: 4 })
  plannedQty: number;

  @Column({ name: 'actual_qty', type: 'decimal', precision: 14, scale: 4, nullable: true })
  actualQty: number | null;

  @Column({ type: 'enum', enum: ProductionOrderStatus, default: ProductionOrderStatus.DRAFT })
  status: ProductionOrderStatus;

  @Column({ name: 'theoretical_cost', type: 'decimal', precision: 14, scale: 4, nullable: true })
  theoreticalCost: number | null;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 14, scale: 4, nullable: true })
  actualCost: number | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
