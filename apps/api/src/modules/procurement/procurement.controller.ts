import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ProcurementService } from './procurement.service';

@Controller('purchase-orders')
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.service.findAll(user.tenantId, pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.tenantId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.approve(id, user.tenantId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.cancel(id, user.tenantId);
  }
}
