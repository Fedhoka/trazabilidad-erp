import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeComponent } from './entities/recipe-component.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionConsumption } from './entities/production-consumption.entity';
import { FinishedLot } from './entities/finished-lot.entity';
import { MaterialLot } from '../inventory/entities/material-lot.entity';
import { Material } from '../materials/entities/material.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { ProductionOrdersService } from './production-orders.service';
import { ProductionOrdersController } from './production-orders.controller';
import { TraceabilityService } from './traceability.service';
import { TraceabilityController } from './traceability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recipe,
      RecipeComponent,
      ProductionOrder,
      ProductionConsumption,
      FinishedLot,
      MaterialLot,
      Material,
    ]),
  ],
  providers: [RecipesService, ProductionOrdersService, TraceabilityService],
  controllers: [RecipesController, ProductionOrdersController, TraceabilityController],
  exports: [RecipesService, ProductionOrdersService, TraceabilityService],
})
export class ProductionModule {}
