import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateSupplierDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.tenantId);
  }
}
