import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointOfSale } from './entities/point-of-sale.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { FiscalCounter } from './entities/fiscal-counter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PointOfSale, Invoice, InvoiceLine, FiscalCounter])],
  exports: [TypeOrmModule],
})
export class FiscalModule {}
