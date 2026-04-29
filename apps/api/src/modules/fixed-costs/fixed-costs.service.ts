import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedCost } from './entities/fixed-cost.entity';
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { UpdateFixedCostDto } from './dto/update-fixed-cost.dto';

@Injectable()
export class FixedCostsService {
  constructor(
    @InjectRepository(FixedCost)
    private readonly repo: Repository<FixedCost>,
  ) {}

  /**
   * Returns all fixed costs for a tenant. Active ones first, then archived,
   * each block sorted by descending amount so the biggest expenses surface
   * at the top.
   */
  findAll(tenantId: string) {
    return this.repo.find({
      where: { tenantId },
      order: { isActive: 'DESC', amount: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const cost = await this.repo.findOne({ where: { id, tenantId } });
    if (!cost) throw new NotFoundException('Fixed cost not found');
    return cost;
  }

  create(dto: CreateFixedCostDto, tenantId: string) {
    const cost = this.repo.create({
      ...dto,
      // amount is decimal — node-postgres expects a string for INSERT to keep precision.
      amount: dto.amount.toFixed(2),
      tenantId,
    });
    return this.repo.save(cost);
  }

  async update(id: string, dto: UpdateFixedCostDto, tenantId: string) {
    const cost = await this.findOne(id, tenantId);
    const next: Partial<FixedCost> = {};
    if (dto.name !== undefined) next.name = dto.name;
    if (dto.category !== undefined) next.category = dto.category;
    if (dto.amount !== undefined) next.amount = dto.amount.toFixed(2);
    if (dto.isActive !== undefined) next.isActive = dto.isActive;
    if (dto.notes !== undefined) next.notes = dto.notes;
    Object.assign(cost, next);
    return this.repo.save(cost);
  }

  /** Soft-delete via is_active=false. Hard delete is intentionally avoided so historical break-even data stays meaningful. */
  async archive(id: string, tenantId: string) {
    const cost = await this.findOne(id, tenantId);
    cost.isActive = false;
    return this.repo.save(cost);
  }

  /** Sum of active monthly amounts for a tenant — used by the break-even calc. */
  async sumActiveMonthly(tenantId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('fc')
      .select('COALESCE(SUM(fc.amount), 0)', 'total')
      .where('fc.tenant_id = :tenantId AND fc.is_active = true', { tenantId })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }
}
