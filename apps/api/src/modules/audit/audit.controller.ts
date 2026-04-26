import { Controller, Get, Query, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  /** OWNER-only: paginated audit log for the caller's tenant. */
  @Get()
  @Roles(UserRole.OWNER)
  findAll(@Request() req: any, @Query() pagination: PaginationDto) {
    return this.service.findByTenant(req.user.tenantId, pagination);
  }
}
