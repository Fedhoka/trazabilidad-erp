import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptLine } from './entities/goods-receipt-line.entity';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { MaterialLot, LotStatus } from '../inventory/entities/material-lot.entity';
import { Material } from '../materials/entities/material.entity';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { QcStatus } from './entities/goods-receipt-line.entity';

@Injectable()
export class GoodsReceiptsService {
  constructor(
    @InjectRepository(GoodsReceipt)
    private readonly receiptRepo: Repository<GoodsReceipt>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string) {
    return this.receiptRepo.find({
      where: { tenantId },
      relations: ['lines'],
      order: { receivedAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const receipt = await this.receiptRepo.findOne({ where: { id, tenantId }, relations: ['lines'] });
    if (!receipt) throw new NotFoundException('Goods receipt not found');
    return receipt;
  }

  async create(dto: CreateGoodsReceiptDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const po = await manager.findOne(PurchaseOrder, {
        where: { id: dto.purchaseOrderId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!po) throw new NotFoundException('Purchase order not found');
      if (po.status !== PurchaseOrderStatus.APPROVED) {
        throw new BadRequestException(`PO must be APPROVED to receive (current: ${po.status})`);
      }

      const receivedAt = dto.receivedAt ? new Date(dto.receivedAt) : new Date();
      const receipt = manager.create(GoodsReceipt, {
        tenantId,
        purchaseOrderId: po.id,
        receivedAt,
        notes: dto.notes ?? null,
      });
      await manager.save(receipt);

      const affectedMaterials = new Set<string>();

      for (const lineDto of dto.lines) {
        const poLine = await manager.findOne(PurchaseOrderLine, {
          where: { id: lineDto.purchaseOrderLineId, purchaseOrderId: po.id, tenantId },
        });
        if (!poLine) throw new NotFoundException(`PO line ${lineDto.purchaseOrderLineId} not found`);

        const material = await manager.findOne(Material, { where: { id: poLine.materialId, tenantId } });
        if (!material) throw new NotFoundException(`Material ${poLine.materialId} not found`);

        const expiresOn = this.resolveExpiry(lineDto.expiresOn, material.shelfLifeDays, receivedAt);
        const lotStatus = this.qcToLotStatus(lineDto.qcStatus);

        const lot = manager.create(MaterialLot, {
          tenantId,
          lotCode: lineDto.lotCode,
          materialId: poLine.materialId,
          supplierId: po.supplierId,
          quantity: lineDto.quantity,
          unitCost: lineDto.unitCost,
          status: lotStatus,
          expiresOn,
          receivedAt,
        });
        await manager.save(lot);

        const grl = manager.create(GoodsReceiptLine, {
          tenantId,
          goodsReceiptId: receipt.id,
          purchaseOrderLineId: poLine.id,
          materialId: poLine.materialId,
          quantity: lineDto.quantity,
          unitCost: lineDto.unitCost,
          lotCode: lineDto.lotCode,
          expiresOn,
          qcStatus: lineDto.qcStatus,
          qcNotes: lineDto.qcNotes ?? null,
          materialLotId: lot.id,
        });
        await manager.save(grl);

        lot.goodsReceiptLineId = grl.id;
        await manager.save(lot);

        poLine.receivedQty = Number(poLine.receivedQty) + lineDto.quantity;
        await manager.save(poLine);

        affectedMaterials.add(poLine.materialId);
      }

      const allLines = await manager.find(PurchaseOrderLine, { where: { purchaseOrderId: po.id, tenantId } });
      const fullyReceived = allLines.every((l) => Number(l.receivedQty) >= Number(l.quantity));
      if (fullyReceived) {
        po.status = PurchaseOrderStatus.RECEIVED;
        await manager.save(po);
      }

      for (const materialId of affectedMaterials) {
        await this.recomputeAvgCost(manager, materialId, tenantId);
      }

      return manager.findOne(GoodsReceipt, { where: { id: receipt.id }, relations: ['lines'] });
    });
  }

  private resolveExpiry(
    expiresOnStr: string | undefined,
    shelfLifeDays: number | null,
    receivedAt: Date,
  ): Date | null {
    if (expiresOnStr) return new Date(expiresOnStr);
    if (shelfLifeDays) {
      const d = new Date(receivedAt);
      d.setDate(d.getDate() + shelfLifeDays);
      return d;
    }
    return null;
  }

  private qcToLotStatus(qcStatus: QcStatus): LotStatus {
    if (qcStatus === QcStatus.PASS) return LotStatus.AVAILABLE;
    if (qcStatus === QcStatus.FAIL) return LotStatus.BLOCKED;
    return LotStatus.QUARANTINE;
  }

  private async recomputeAvgCost(manager: EntityManager, materialId: string, tenantId: string) {
    const result = await manager.query(
      `SELECT COALESCE(SUM(quantity * unit_cost) / NULLIF(SUM(quantity), 0), 0) AS avg_cost
       FROM material_lots
       WHERE material_id = $1 AND tenant_id = $2 AND status IN ('AVAILABLE','QUARANTINE')`,
      [materialId, tenantId],
    );
    const avgCost = parseFloat(result[0]?.avg_cost ?? '0');
    await manager.query(
      `UPDATE materials SET avg_cost = $1, updated_at = now() WHERE id = $2 AND tenant_id = $3`,
      [avgCost, materialId, tenantId],
    );
  }
}
