import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LotStatus } from './entities/material-lot.entity';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';

const CHANGEABLE = new Set<LotStatus>([LotStatus.QUARANTINE, LotStatus.BLOCKED, LotStatus.AVAILABLE]);

const LOT_SELECT = `
  SELECT
    ml.id,
    ml.lot_code       AS "lotCode",
    ml.quantity,
    ml.unit_cost      AS "unitCost",
    ml.status,
    ml.expires_on     AS "expiresOn",
    ml.received_at    AS "receivedAt",
    m.name            AS "materialName",
    m.code            AS "materialCode",
    m.base_uom        AS "baseUom",
    l.name            AS "locationName",
    l.code            AS "locationCode"
  FROM material_lots ml
  JOIN materials  m ON m.id = ml.material_id
  LEFT JOIN locations l ON l.id = ml.location_id`;

@Injectable()
export class InventoryService {
  constructor(private readonly ds: DataSource) {}

  async findLots(tenantId: string, includeExpired = false, { page, limit }: PaginationDto = { page: 1, limit: 25 }) {
    const statusFilter = includeExpired
      ? `ml.status IN ('AVAILABLE', 'QUARANTINE', 'BLOCKED', 'EXPIRED')`
      : `ml.status IN ('AVAILABLE', 'QUARANTINE', 'BLOCKED')`;

    const [data, countRows] = await Promise.all([
      this.ds.query<Record<string, unknown>[]>(
        `${LOT_SELECT}
         WHERE ml.tenant_id = $1
           AND ${statusFilter}
         ORDER BY ml.expires_on ASC NULLS LAST, ml.received_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, (page - 1) * limit],
      ),
      this.ds.query<{ total: string }[]>(
        `SELECT COUNT(*) AS total FROM material_lots ml
          WHERE ml.tenant_id = $1 AND ${statusFilter}`,
        [tenantId],
      ),
    ]);

    const total = parseInt(countRows[0].total, 10);
    return { data, meta: paginateMeta(total, page, limit) };
  }

  /** Lots expiring within the next `days` calendar days (default 7). */
  async expiringSoon(tenantId: string, days = 7) {
    return this.ds.query<Record<string, unknown>[]>(
      `${LOT_SELECT}
       WHERE ml.tenant_id = $1
         AND ml.status IN ('AVAILABLE', 'QUARANTINE')
         AND ml.expires_on IS NOT NULL
         AND ml.expires_on >= NOW()
         AND ml.expires_on <= NOW() + ($2 || ' days')::interval
       ORDER BY ml.expires_on ASC`,
      [tenantId, days],
    );
  }

  async updateLotStatus(id: string, status: LotStatus, tenantId: string) {
    const rows = await this.ds.query<{ status: string }[]>(
      `SELECT status FROM material_lots WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (!rows.length) throw new NotFoundException(`Lot ${id} not found`);
    if (!CHANGEABLE.has(rows[0].status as LotStatus)) {
      throw new BadRequestException('Cannot change status of consumed or expired lot');
    }
    await this.ds.query(
      `UPDATE material_lots SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [status, id, tenantId],
    );
    return { id, status };
  }
}
