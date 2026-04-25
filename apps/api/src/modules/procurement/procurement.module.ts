import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptLine } from './entities/goods-receipt-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderLine, GoodsReceipt, GoodsReceiptLine])],
  exports: [TypeOrmModule],
})
export class ProcurementModule {}
