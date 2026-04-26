import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly repo: Repository<Material>,
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
    const material = await this.repo.findOne({ where: { id, tenantId } });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async create(dto: CreateMaterialDto, tenantId: string) {
    const exists = await this.repo.findOne({ where: { code: dto.code, tenantId } });
    if (exists) throw new ConflictException(`Material code '${dto.code}' already exists`);
    const material = this.repo.create({ ...dto, tenantId });
    return this.repo.save(material);
  }

  async update(id: string, dto: UpdateMaterialDto, tenantId: string) {
    const material = await this.findOne(id, tenantId);
    if (dto.code && dto.code !== material.code) {
      const exists = await this.repo.findOne({ where: { code: dto.code, tenantId } });
      if (exists) throw new ConflictException(`Material code '${dto.code}' already exists`);
    }
    Object.assign(material, dto);
    return this.repo.save(material);
  }
}
