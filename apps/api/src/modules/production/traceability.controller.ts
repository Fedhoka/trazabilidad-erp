import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TraceabilityService } from './traceability.service';

@Controller('traceability')
export class TraceabilityController {
  constructor(private readonly service: TraceabilityService) {}

  @Get(':lotId/backward')
  backward(@Param('lotId') lotId: string, @CurrentUser() user: User) {
    return this.service.backward(lotId, user.tenantId);
  }

  @Get(':lotId/forward')
  forward(@Param('lotId') lotId: string, @CurrentUser() user: User) {
    return this.service.forward(lotId, user.tenantId);
  }

  @Get(':lotId/full')
  full(@Param('lotId') lotId: string, @CurrentUser() user: User) {
    return this.service.full(lotId, user.tenantId);
  }
}
