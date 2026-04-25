import { Column, Entity, OneToMany } from 'typeorm';
import { TenantEntity } from '../../../common/entities/base.entity';
import { RecipeComponent } from './recipe-component.entity';

export enum RecipeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('recipes')
export class Recipe extends TenantEntity {
  @Column()
  name: string;

  @Column({ name: 'output_material_id' })
  outputMaterialId: string;

  @Column({ name: 'output_qty', type: 'decimal', precision: 14, scale: 4 })
  outputQty: number;

  @Column({ name: 'batch_size_uom' })
  batchSizeUom: string;

  @Column({ type: 'enum', enum: RecipeStatus, default: RecipeStatus.DRAFT })
  status: RecipeStatus;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  notes: string | null;

  @OneToMany(() => RecipeComponent, (c) => c.recipe)
  components: RecipeComponent[];
}
