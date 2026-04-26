import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { MaterialLot } from './entities/material-lot.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Location, MaterialLot])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [TypeOrmModule],
})
export class InventoryModule {}
