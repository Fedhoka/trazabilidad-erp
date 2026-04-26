import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { InventoryService } from './inventory.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { LotStatus } from './entities/material-lot.entity';

class UpdateLotStatusDto {
  @IsEnum(LotStatus)
  status: LotStatus;
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('lots')
  findLots(@CurrentUser() user: User) {
    return this.service.findLots(user.tenantId);
  }

  @Patch('lots/:id/status')
  @Roles(UserRole.OWNER, UserRole.QC, UserRole.PROCUREMENT)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLotStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateLotStatus(id, dto.status, user.tenantId);
  }
}
