import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LotStatus } from './entities/material-lot.entity';

const CHANGEABLE = new Set<LotStatus>([LotStatus.QUARANTINE, LotStatus.BLOCKED, LotStatus.AVAILABLE]);

@Injectable()
export class InventoryService {
  constructor(private readonly ds: DataSource) {}

  async findLots(tenantId: string) {
    return this.ds.query<Record<string, unknown>[]>(
      `SELECT
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
       LEFT JOIN locations l ON l.id = ml.location_id
       WHERE ml.tenant_id = $1
         AND ml.status IN ('AVAILABLE', 'QUARANTINE', 'BLOCKED')
       ORDER BY ml.expires_on ASC NULLS LAST, ml.received_at DESC`,
      [tenantId],
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
