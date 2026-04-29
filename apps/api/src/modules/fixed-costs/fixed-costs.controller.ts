import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { UpdateFixedCostDto } from './dto/update-fixed-cost.dto';
import { FixedCostsService } from './fixed-costs.service';

@Controller('fixed-costs')
export class FixedCostsController {
  constructor(private readonly service: FixedCostsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.tenantId);
  }

  /** Owners and finance roles can edit fixed costs (impacts break-even). */
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  @Post()
  create(@Body() dto: CreateFixedCostDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.tenantId);
  }

  @Roles(UserRole.OWNER, UserRole.FINANCE)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFixedCostDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Roles(UserRole.OWNER, UserRole.FINANCE)
  @Delete(':id')
  archive(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.archive(id, user.tenantId);
  }
}
