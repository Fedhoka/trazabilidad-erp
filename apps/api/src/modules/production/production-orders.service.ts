import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductionOrder, ProductionOrderStatus } from './entities/production-order.entity';
import { ProductionConsumption } from './entities/production-consumption.entity';
import { FinishedLot } from './entities/finished-lot.entity';
import { Recipe, RecipeStatus } from './entities/recipe.entity';
import { RecipeComponent } from './entities/recipe-component.entity';
import { MaterialLot, LotStatus } from '../inventory/entities/material-lot.entity';
import { Material } from '../materials/entities/material.entity';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { RecordConsumptionDto } from './dto/record-consumption.dto';
import { CompleteProductionOrderDto } from './dto/complete-production-order.dto';

@Injectable()
export class ProductionOrdersService {
  constructor(
    @InjectRepository(ProductionOrder)
    private readonly poRepo: Repository<ProductionOrder>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(tenantId: string, { page, limit }: PaginationDto) {
    const [data, total] = await this.poRepo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: paginateMeta(total, page, limit) };
  }

  async findOne(id: string, tenantId: string) {
    const po = await this.poRepo.findOne({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Production order not found');
    return po;
  }

  async create(dto: CreateProductionOrderDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const recipe = await manager.findOne(Recipe, {
        where: { id: dto.recipeId, tenantId },
        relations: ['components'],
      });
      if (!recipe) throw new NotFoundException('Recipe not found');
      if (recipe.status !== RecipeStatus.ACTIVE) {
        throw new BadRequestException('Recipe must be ACTIVE to create a production order');
      }

      const result = await manager.query(
        `SELECT COALESCE(MAX(number), 0) + 1 AS next FROM production_orders WHERE tenant_id = $1`,
        [tenantId],
      );
      const number: number = result[0].next;

      const scale = Number(dto.plannedQty) / Number(recipe.outputQty);
      let theoreticalCost = 0;
      for (const component of recipe.components) {
        const material = await manager.findOne(Material, { where: { id: component.materialId, tenantId } });
        if (material) {
          theoreticalCost +=
            Number(component.qtyPerBatch) * scale * (1 + Number(component.lossPct) / 100) * Number(material.avgCost);
        }
      }

      const po = manager.create(ProductionOrder, {
        tenantId,
        number,
        recipeId: recipe.id,
        outputMaterialId: recipe.outputMaterialId,
        plannedQty: dto.plannedQty,
        theoreticalCost,
        status: ProductionOrderStatus.DRAFT,
        notes: dto.notes ?? null,
      });
      return manager.save(po);
    });
  }

  async start(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);
    if (po.status !== ProductionOrderStatus.DRAFT) {
      throw new BadRequestException(`Cannot start production order in status ${po.status}`);
    }
    po.status = ProductionOrderStatus.IN_PROGRESS;
    po.startedAt = new Date();
    return this.poRepo.save(po);
  }

  async recordConsumption(id: string, dto: RecordConsumptionDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const po = await manager.findOne(ProductionOrder, { where: { id, tenantId } });
      if (!po) throw new NotFoundException('Production order not found');
      if (po.status !== ProductionOrderStatus.IN_PROGRESS) {
        throw new BadRequestException('Production order must be IN_PROGRESS to record consumption');
      }

      const lot = await manager.findOne(MaterialLot, {
        where: { id: dto.materialLotId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lot) throw new NotFoundException('Material lot not found');
      if (lot.status !== LotStatus.AVAILABLE && lot.status !== LotStatus.QUARANTINE) {
        throw new BadRequestException(`Lot status ${lot.status} cannot be consumed`);
      }
      if (Number(lot.quantity) < dto.quantity) {
        throw new BadRequestException(
          `Insufficient lot quantity: available ${lot.quantity}, requested ${dto.quantity}`,
        );
      }

      const consumption = manager.create(ProductionConsumption, {
        tenantId,
        productionOrderId: po.id,
        materialLotId: lot.id,
        materialId: lot.materialId,
        quantity: dto.quantity,
        unitCost: lot.unitCost,
        consumedAt: new Date(),
      });
      await manager.save(consumption);

      lot.quantity = Number(lot.quantity) - dto.quantity;
      if (Number(lot.quantity) <= 0) {
        lot.quantity = 0;
        lot.status = LotStatus.CONSUMED;
      }
      await manager.save(lot);

      return consumption;
    });
  }

  async complete(id: string, dto: CompleteProductionOrderDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const po = await manager.findOne(ProductionOrder, { where: { id, tenantId } });
      if (!po) throw new NotFoundException('Production order not found');
      if (po.status !== ProductionOrderStatus.IN_PROGRESS) {
        throw new BadRequestException('Production order must be IN_PROGRESS to complete');
      }

      const consumptions = await manager.find(ProductionConsumption, {
        where: { productionOrderId: id, tenantId },
      });
      const totalCost = consumptions.reduce(
        (sum, c) => sum + Number(c.quantity) * Number(c.unitCost),
        0,
      );
      const unitCost = dto.actualQty > 0 ? totalCost / dto.actualQty : 0;

      const material = await manager.findOne(Material, { where: { id: po.outputMaterialId, tenantId } });
      let expiresOn: Date | null = null;
      if (dto.expiresOn) {
        expiresOn = new Date(dto.expiresOn);
      } else if (material?.shelfLifeDays) {
        const d = new Date();
        d.setDate(d.getDate() + material.shelfLifeDays);
        expiresOn = d;
      }

      const finishedLot = manager.create(FinishedLot, {
        tenantId,
        lotCode: dto.lotCode,
        materialId: po.outputMaterialId,
        productionOrderId: po.id,
        quantity: dto.actualQty,
        unitCost,
        status: LotStatus.AVAILABLE,
        expiresOn,
      });
      await manager.save(finishedLot);

      po.status = ProductionOrderStatus.COMPLETED;
      po.actualQty = dto.actualQty;
      po.actualCost = totalCost;
      po.completedAt = new Date();
      if (dto.notes) po.notes = dto.notes;
      await manager.save(po);

      const result = await manager.query(
        `SELECT COALESCE(SUM(quantity * unit_cost) / NULLIF(SUM(quantity), 0), 0) AS avg_cost
         FROM finished_lots
         WHERE material_id = $1 AND tenant_id = $2 AND status IN ('AVAILABLE','QUARANTINE')`,
        [po.outputMaterialId, tenantId],
      );
      const avgCost = parseFloat(result[0]?.avg_cost ?? '0');
      await manager.query(
        `UPDATE materials SET avg_cost = $1, updated_at = now() WHERE id = $2 AND tenant_id = $3`,
        [avgCost, po.outputMaterialId, tenantId],
      );

      return { productionOrder: po, finishedLot };
    });
  }

  async cancel(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);
    if (![ProductionOrderStatus.DRAFT, ProductionOrderStatus.IN_PROGRESS].includes(po.status)) {
      throw new BadRequestException(`Cannot cancel production order in status ${po.status}`);
    }
    po.status = ProductionOrderStatus.CANCELLED;
    return this.poRepo.save(po);
  }
}
