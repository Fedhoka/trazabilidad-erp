import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointOfSale } from './entities/point-of-sale.entity';
import { CreatePointOfSaleDto } from './dto/create-point-of-sale.dto';

@Injectable()
export class PointsOfSaleService {
  constructor(
    @InjectRepository(PointOfSale)
    private readonly repo: Repository<PointOfSale>,
  ) {}

  findAll(tenantId: string) {
    return this.repo.find({ where: { tenantId }, order: { number: 'ASC' } });
  }

  async findOne(id: string, tenantId: string) {
    const pos = await this.repo.findOne({ where: { id, tenantId } });
    if (!pos) throw new NotFoundException(`Point of sale ${id} not found`);
    return pos;
  }

  async create(dto: CreatePointOfSaleDto, tenantId: string) {
    const existing = await this.repo.findOne({ where: { number: dto.number, tenantId } });
    if (existing) throw new ConflictException(`Point of sale number ${dto.number} already exists`);
    const pos = this.repo.create({ ...dto, tenantId, isActive: true });
    return this.repo.save(pos);
  }
}
