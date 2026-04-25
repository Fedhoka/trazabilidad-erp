import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { GoodsReceiptsService } from './goods-receipts.service';

@Controller('goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly service: GoodsReceiptsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateGoodsReceiptDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.tenantId);
  }
}
