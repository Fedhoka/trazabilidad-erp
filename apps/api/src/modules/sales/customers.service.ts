import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  findAll(tenantId: string) {
    return this.repo.find({ where: { tenantId } });
  }

  async findOne(id: string, tenantId: string) {
    const customer = await this.repo.findOne({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async create(dto: CreateCustomerDto, tenantId: string) {
    if (dto.cuit) {
      const existing = await this.repo.findOne({ where: { cuit: dto.cuit, tenantId } });
      if (existing) throw new ConflictException(`Customer with CUIT ${dto.cuit} already exists`);
    }
    const customer = this.repo.create({ ...dto, tenantId });
    return this.repo.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto, tenantId: string) {
    const customer = await this.findOne(id, tenantId);
    if (dto.cuit && dto.cuit !== customer.cuit) {
      const existing = await this.repo.findOne({ where: { cuit: dto.cuit, tenantId } });
      if (existing) throw new ConflictException(`Customer with CUIT ${dto.cuit} already exists`);
    }
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }
}
