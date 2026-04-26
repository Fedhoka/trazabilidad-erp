import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentLine } from './entities/shipment-line.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, SalesOrder, SalesOrderLine, Shipment, ShipmentLine])],
  controllers: [CustomersController, SalesOrdersController],
  providers: [CustomersService, SalesOrdersService],
  exports: [TypeOrmModule, CustomersService, SalesOrdersService],
})
export class SalesModule {}
