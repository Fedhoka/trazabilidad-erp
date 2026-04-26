import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialsService } from './materials.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.service.findAll(user.tenantId, pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateMaterialDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.tenantId);
  }
}
