import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptLine } from './entities/goods-receipt-line.entity';
import { MaterialLot } from '../inventory/entities/material-lot.entity';
import { Material } from '../materials/entities/material.entity';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { GoodsReceiptsService } from './goods-receipts.service';
import { GoodsReceiptsController } from './goods-receipts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      GoodsReceipt,
      GoodsReceiptLine,
      MaterialLot,
      Material,
    ]),
  ],
  providers: [ProcurementService, GoodsReceiptsService],
  controllers: [ProcurementController, GoodsReceiptsController],
  exports: [ProcurementService, GoodsReceiptsService],
})
export class ProcurementModule {}
