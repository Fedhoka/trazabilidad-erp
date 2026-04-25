import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeComponent } from './entities/recipe-component.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionConsumption } from './entities/production-consumption.entity';
import { FinishedLot } from './entities/finished-lot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, RecipeComponent, ProductionOrder, ProductionConsumption, FinishedLot])],
  exports: [TypeOrmModule],
})
export class ProductionModule {}
