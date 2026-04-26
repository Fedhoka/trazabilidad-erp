import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Recipe, RecipeStatus } from './entities/recipe.entity';
import { RecipeComponent } from './entities/recipe-component.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(tenantId: string, { page, limit }: PaginationDto) {
    const [data, total] = await this.recipeRepo.findAndCount({
      where: { tenantId },
      relations: ['components'],
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: paginateMeta(total, page, limit) };
  }

  async findOne(id: string, tenantId: string) {
    const recipe = await this.recipeRepo.findOne({ where: { id, tenantId }, relations: ['components'] });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async create(dto: CreateRecipeDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const recipe = manager.create(Recipe, {
        tenantId,
        name: dto.name,
        outputMaterialId: dto.outputMaterialId,
        outputQty: dto.outputQty,
        batchSizeUom: dto.batchSizeUom,
        notes: dto.notes ?? null,
        status: RecipeStatus.DRAFT,
        version: 1,
      });
      await manager.save(recipe);

      for (const c of dto.components) {
        const component = manager.create(RecipeComponent, {
          tenantId,
          recipeId: recipe.id,
          materialId: c.materialId,
          qtyPerBatch: c.qtyPerBatch,
          lossPct: c.lossPct ?? 0,
        });
        await manager.save(component);
      }

      return manager.findOne(Recipe, { where: { id: recipe.id }, relations: ['components'] });
    });
  }

  async activate(id: string, tenantId: string) {
    const recipe = await this.findOne(id, tenantId);
    if (recipe.status !== RecipeStatus.DRAFT) {
      throw new BadRequestException(`Cannot activate recipe in status ${recipe.status}`);
    }
    recipe.status = RecipeStatus.ACTIVE;
    return this.recipeRepo.save(recipe);
  }

  async archive(id: string, tenantId: string) {
    const recipe = await this.findOne(id, tenantId);
    if (recipe.status !== RecipeStatus.ACTIVE) {
      throw new BadRequestException(`Cannot archive recipe in status ${recipe.status}`);
    }
    recipe.status = RecipeStatus.ARCHIVED;
    return this.recipeRepo.save(recipe);
  }
}
