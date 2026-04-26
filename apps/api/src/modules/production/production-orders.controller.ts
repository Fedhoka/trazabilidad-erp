import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { RecordConsumptionDto } from './dto/record-consumption.dto';
import { CompleteProductionOrderDto } from './dto/complete-production-order.dto';
import { ProductionOrdersService } from './production-orders.service';

@Controller('production-orders')
export class ProductionOrdersController {
  constructor(private readonly service: ProductionOrdersService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.service.findAll(user.tenantId, pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateProductionOrderDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.tenantId);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.start(id, user.tenantId);
  }

  @Post(':id/consume')
  recordConsumption(
    @Param('id') id: string,
    @Body() dto: RecordConsumptionDto,
    @CurrentUser() user: User,
  ) {
    return this.service.recordConsumption(id, dto, user.tenantId);
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteProductionOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.service.complete(id, dto, user.tenantId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.cancel(id, user.tenantId);
  }
}
