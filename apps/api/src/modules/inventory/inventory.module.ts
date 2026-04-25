import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { MaterialLot } from './entities/material-lot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, MaterialLot])],
  exports: [TypeOrmModule],
})
export class InventoryModule {}
