import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from './entities/audit-log.entity';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';

export interface AuditContext {
  tenantId: string;
  userId?: string | null;
  userEmail?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Fire-and-forget — never throws, so a logging failure never breaks a request.
   */
  log(ctx: AuditContext): void {
    const record = this.repo.create({
      tenantId: ctx.tenantId,
      userId: ctx.userId ?? null,
      userEmail: ctx.userEmail ?? null,
      action: ctx.action,
      entity: ctx.entity,
      entityId: ctx.entityId ?? null,
      metadata: ctx.metadata ?? null,
      ipAddress: ctx.ipAddress ?? null,
    });

    this.repo.save(record).catch((err: unknown) => {
      this.logger.error({ err }, 'Failed to save audit log entry');
    });
  }

  async findByTenant(tenantId: string, { page, limit }: PaginationDto) {
    const [data, total] = await this.repo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: paginateMeta(total, page, limit) };
  }
}
