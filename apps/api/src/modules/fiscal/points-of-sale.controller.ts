import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Request } from '@nestjs/common';
import { PointsOfSaleService } from './points-of-sale.service';
import { CreatePointOfSaleDto } from './dto/create-point-of-sale.dto';

@Controller('points-of-sale')
export class PointsOfSaleController {
  constructor(private readonly service: PointsOfSaleService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreatePointOfSaleDto, @Request() req: any) {
    return this.service.create(dto, req.user.tenantId);
  }
}
