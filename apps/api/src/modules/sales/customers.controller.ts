import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Request } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  findAll(@Request() req: any, @Query() pagination: PaginationDto) {
    return this.service.findAll(req.user.tenantId, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @Request() req: any) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }
}
