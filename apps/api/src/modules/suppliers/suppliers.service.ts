import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  async findAll(tenantId: string, { page, limit }: PaginationDto) {
    const [data, total] = await this.repo.findAndCount({
      where: { tenantId },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: paginateMeta(total, page, limit) };
  }

  async findOne(id: string, tenantId: string) {
    const supplier = await this.repo.findOne({ where: { id, tenantId } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  create(dto: CreateSupplierDto, tenantId: string) {
    const supplier = this.repo.create({ ...dto, tenantId });
    return this.repo.save(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto, tenantId: string) {
    const supplier = await this.findOne(id, tenantId);
    Object.assign(supplier, dto);
    return this.repo.save(supplier);
  }
}
