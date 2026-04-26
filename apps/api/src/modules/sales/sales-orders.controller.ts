import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Request } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateSalesOrderDto, @Request() req: any) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.confirm(id, req.user.tenantId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.cancel(id, req.user.tenantId);
  }
}
