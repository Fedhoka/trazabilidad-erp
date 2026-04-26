import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderLine)
    private readonly lineRepo: Repository<SalesOrderLine>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string) {
    return this.soRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const so = await this.soRepo.findOne({ where: { id, tenantId } });
    if (!so) throw new NotFoundException(`Sales order ${id} not found`);
    const lines = await this.lineRepo.find({ where: { salesOrderId: id, tenantId } });
    return { ...so, lines };
  }

  async create(dto: CreateSalesOrderDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.query(
        `SELECT COALESCE(MAX(number), 0) + 1 AS next FROM sales_orders WHERE tenant_id = $1`,
        [tenantId],
      );
      const number: number = parseInt(result[0].next, 10);

      const so = manager.create(SalesOrder, {
        tenantId,
        number,
        customerId: dto.customerId,
        notes: dto.notes ?? null,
        status: SalesOrderStatus.DRAFT,
      });
      const saved = await manager.save(SalesOrder, so);

      const lines = dto.lines.map((l) =>
        manager.create(SalesOrderLine, {
          tenantId,
          salesOrderId: saved.id,
          materialId: l.materialId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        }),
      );
      await manager.save(SalesOrderLine, lines);

      return { ...saved, lines };
    });
  }

  async confirm(id: string, tenantId: string) {
    const so = await this.soRepo.findOne({ where: { id, tenantId } });
    if (!so) throw new NotFoundException(`Sales order ${id} not found`);
    if (so.status !== SalesOrderStatus.DRAFT)
      throw new BadRequestException(`Only DRAFT orders can be confirmed`);
    so.status = SalesOrderStatus.CONFIRMED;
    return this.soRepo.save(so);
  }

  async cancel(id: string, tenantId: string) {
    const so = await this.soRepo.findOne({ where: { id, tenantId } });
    if (!so) throw new NotFoundException(`Sales order ${id} not found`);
    if (so.status === SalesOrderStatus.INVOICED || so.status === SalesOrderStatus.SHIPPED)
      throw new BadRequestException(`Cannot cancel a ${so.status} order`);
    so.status = SalesOrderStatus.CANCELLED;
    return this.soRepo.save(so);
  }

  async markInvoiced(id: string, tenantId: string) {
    const so = await this.soRepo.findOne({ where: { id, tenantId } });
    if (!so) throw new NotFoundException(`Sales order ${id} not found`);
    so.status = SalesOrderStatus.INVOICED;
    return this.soRepo.save(so);
  }
}
