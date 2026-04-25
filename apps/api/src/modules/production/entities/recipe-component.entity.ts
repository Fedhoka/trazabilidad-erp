import { Column, Entity } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';

@Entity('recipe_components')
export class RecipeComponent extends TenantEntity {
  @Column({ name: 'recipe_id' })
  recipeId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ name: 'qty_per_batch', type: 'decimal', precision: 14, scale: 4 })
  qtyPerBatch: number;

  @Column({ name: 'loss_pct', type: 'decimal', precision: 5, scale: 2, default: 0 })
  lossPct: number;
}
