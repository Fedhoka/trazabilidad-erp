import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderLine)
    private readonly polRepo: Repository<PurchaseOrderLine>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string) {
    return this.poRepo.find({
      where: { tenantId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const po = await this.poRepo.findOne({ where: { id, tenantId }, relations: ['lines'] });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.query(
        `SELECT COALESCE(MAX(number), 0) + 1 AS next FROM purchase_orders WHERE tenant_id = $1`,
        [tenantId],
      );
      const number: number = result[0].next;

      const po = manager.create(PurchaseOrder, {
        tenantId,
        number,
        supplierId: dto.supplierId,
        notes: dto.notes ?? null,
        status: PurchaseOrderStatus.DRAFT,
      });
      await manager.save(po);

      for (const lineDto of dto.lines) {
        const line = manager.create(PurchaseOrderLine, {
          tenantId,
          purchaseOrderId: po.id,
          materialId: lineDto.materialId,
          quantity: lineDto.quantity,
          unitPrice: lineDto.unitPrice,
          receivedQty: 0,
        });
        await manager.save(line);
      }

      return manager.findOne(PurchaseOrder, { where: { id: po.id }, relations: ['lines'] });
    });
  }

  async approve(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(`Cannot approve a PO in status ${po.status}`);
    }
    po.status = PurchaseOrderStatus.APPROVED;
    return this.poRepo.save(po);
  }

  async cancel(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);
    if (![PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.APPROVED].includes(po.status)) {
      throw new BadRequestException(`Cannot cancel a PO in status ${po.status}`);
    }
    po.status = PurchaseOrderStatus.CANCELLED;
    return this.poRepo.save(po);
  }
}
