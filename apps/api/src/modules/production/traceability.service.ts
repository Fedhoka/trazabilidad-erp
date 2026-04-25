import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinishedLot } from './entities/finished-lot.entity';

@Injectable()
export class TraceabilityService {
  constructor(
    @InjectRepository(FinishedLot)
    private readonly finishedLotRepo: Repository<FinishedLot>,
    private readonly dataSource: DataSource,
  ) {}

  async backward(finishedLotId: string, tenantId: string) {
    const lot = await this.finishedLotRepo.findOne({ where: { id: finishedLotId, tenantId } });
    if (!lot) throw new NotFoundException('Finished lot not found');

    const rows = await this.dataSource.query(
      `SELECT
         fl.id                    AS finished_lot_id,
         fl.lot_code              AS finished_lot_code,
         fl.quantity              AS finished_qty,
         fl.unit_cost             AS finished_unit_cost,
         fl.expires_on            AS finished_expires_on,
         po.id                    AS production_order_id,
         po.number                AS production_order_number,
         po.completed_at,
         json_agg(
           json_build_object(
             'consumption_id',   pc.id,
             'material_id',      pc.material_id,
             'material_name',    m.name,
             'material_code',    m.code,
             'lot_id',           ml.id,
             'lot_code',         ml.lot_code,
             'quantity_consumed',pc.quantity,
             'unit_cost',        pc.unit_cost,
             'lot_expires_on',   ml.expires_on,
             'lot_received_at',  ml.received_at,
             'supplier_id',      s.id,
             'supplier_name',    s.name,
             'goods_receipt_id', gr.id,
             'receipt_date',     gr.received_at
           )
         ) FILTER (WHERE pc.id IS NOT NULL) AS inputs
       FROM finished_lots fl
       JOIN production_orders po ON po.id = fl.production_order_id
       LEFT JOIN production_consumptions pc
         ON pc.production_order_id = po.id AND pc.tenant_id = $2
       LEFT JOIN material_lots ml ON ml.id = pc.material_lot_id
       LEFT JOIN materials m ON m.id = pc.material_id
       LEFT JOIN suppliers s ON s.id = ml.supplier_id
       LEFT JOIN goods_receipt_lines grl ON grl.id = ml.goods_receipt_line_id
       LEFT JOIN goods_receipts gr ON gr.id = grl.goods_receipt_id
       WHERE fl.id = $1 AND fl.tenant_id = $2
       GROUP BY fl.id, fl.lot_code, fl.quantity, fl.unit_cost, fl.expires_on,
                po.id, po.number, po.completed_at`,
      [finishedLotId, tenantId],
    );

    return rows[0] ?? null;
  }

  async forward(finishedLotId: string, tenantId: string) {
    const lot = await this.finishedLotRepo.findOne({ where: { id: finishedLotId, tenantId } });
    if (!lot) throw new NotFoundException('Finished lot not found');

    const rows = await this.dataSource.query(
      `SELECT
         fl.id        AS finished_lot_id,
         fl.lot_code,
         fl.quantity,
         fl.status,
         json_agg(
           json_build_object(
             'shipment_line_id',    sl.id,
             'quantity_shipped',    sl.quantity,
             'shipment_id',         sh.id,
             'shipped_at',          sh.shipped_at,
             'sales_order_id',      so.id,
             'sales_order_number',  so.number,
             'customer_id',         c.id,
             'customer_name',       c.name,
             'customer_cuit',       c.cuit
           )
         ) FILTER (WHERE sl.id IS NOT NULL) AS shipments
       FROM finished_lots fl
       LEFT JOIN shipment_lines sl
         ON sl.finished_lot_id = fl.id AND sl.tenant_id = $2
       LEFT JOIN shipments sh ON sh.id = sl.shipment_id
       LEFT JOIN sales_orders so ON so.id = sh.sales_order_id
       LEFT JOIN customers c ON c.id = so.customer_id
       WHERE fl.id = $1 AND fl.tenant_id = $2
       GROUP BY fl.id, fl.lot_code, fl.quantity, fl.status`,
      [finishedLotId, tenantId],
    );

    return rows[0] ?? null;
  }

  async full(finishedLotId: string, tenantId: string) {
    const [back, fwd] = await Promise.all([
      this.backward(finishedLotId, tenantId),
      this.forward(finishedLotId, tenantId),
    ]);
    return { backward: back, forward: fwd };
  }
}
