import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentLine } from './entities/shipment-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, SalesOrder, SalesOrderLine, Shipment, ShipmentLine])],
  exports: [TypeOrmModule],
})
export class SalesModule {}
