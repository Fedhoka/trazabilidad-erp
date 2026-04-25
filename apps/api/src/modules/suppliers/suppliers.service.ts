import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  findAll(tenantId: string) {
    return this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
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
