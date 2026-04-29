import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedCost } from './entities/fixed-cost.entity';
import { FixedCostsService } from './fixed-costs.service';
import { FixedCostsController } from './fixed-costs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FixedCost])],
  providers: [FixedCostsService],
  controllers: [FixedCostsController],
  exports: [FixedCostsService],
})
export class FixedCostsModule {}
