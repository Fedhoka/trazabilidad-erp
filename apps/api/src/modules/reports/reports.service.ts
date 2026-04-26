import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

type Cell = string | number | null | undefined;

function toCsv(headers: string[], rows: Cell[][]): string {
  const esc = (v: Cell) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}

function fmtDate(v: unknown): string {
  if (!v) return '';
  return new Date(v as string).toLocaleDateString('es-AR');
}

function fmtNum(v: unknown, decimals = 2): string {
  if (v === null || v === undefined) return '';
  return Number(v).toFixed(decimals);
}

@Injectable()
export class ReportsService {
  constructor(private readonly ds: DataSource) {}

  async stockCsv(tenantId: string): Promise<string> {
    const rows = await this.ds.query<any[]>(
      `SELECT m.name AS material, m.code AS material_code, m.base_uom,
              ml.lot_code, ml.quantity, ml.unit_cost,
              ml.quantity * ml.unit_cost AS total_value,
              ml.status, ml.expires_on, ml.received_at,
              l.name AS location
       FROM material_lots ml
       JOIN materials m ON m.id = ml.material_id
       LEFT JOIN locations l ON l.id = ml.location_id
       WHERE ml.tenant_id = $1
         AND ml.status IN ('AVAILABLE','QUARANTINE','BLOCKED')
       ORDER BY ml.expires_on ASC NULLS LAST, m.name`,
      [tenantId],
    );

    return toCsv(
      ['Material', 'Código', 'UdM', 'Lote', 'Cantidad', 'Costo unit.', 'Valor total', 'Estado', 'Vencimiento', 'Recibido', 'Ubicación'],
      rows.map((r) => [
        r.material, r.material_code, r.base_uom, r.lot_code,
        fmtNum(r.quantity, 4), fmtNum(r.unit_cost, 4), fmtNum(r.total_value),
        r.status, fmtDate(r.expires_on), fmtDate(r.received_at), r.location ?? '',
      ]),
    );
  }

  async invoicesCsv(tenantId: string): Promise<string> {
    const rows = await this.ds.query<any[]>(
      `SELECT i.invoice_type, i.invoice_number,
              pos.number AS pos_number,
              c.name AS customer, c.cuit AS customer_cuit,
              i.net_amount, i.iva_amount, i.total_amount,
              i.status, i.cae, i.cae_expires_on, i.issued_at
       FROM invoices i
       JOIN points_of_sale pos ON pos.id = i.point_of_sale_id
       JOIN customers c ON c.id = i.customer_id
       WHERE i.tenant_id = $1
       ORDER BY i.invoice_number DESC`,
      [tenantId],
    );

    return toCsv(
      ['Tipo', 'PV', 'Número', 'Cliente', 'CUIT cliente', 'Neto', 'IVA', 'Total', 'Estado', 'CAE', 'Vto. CAE', 'Fecha emisión'],
      rows.map((r) => [
        `Fac. ${r.invoice_type}`,
        String(r.pos_number).padStart(4, '0'),
        String(r.invoice_number).padStart(8, '0'),
        r.customer, r.customer_cuit ?? '',
        fmtNum(r.net_amount), fmtNum(r.iva_amount), fmtNum(r.total_amount),
        r.status, r.cae ?? '', fmtDate(r.cae_expires_on), fmtDate(r.issued_at),
      ]),
    );
  }

  async productionCostsCsv(tenantId: string): Promise<string> {
    const rows = await this.ds.query<any[]>(
      `SELECT po.number, m.name AS output_material, m.code AS material_code,
              po.planned_qty, po.actual_qty,
              po.theoretical_cost, po.actual_cost, po.status,
              po.started_at, po.completed_at
       FROM production_orders po
       JOIN materials m ON m.id = po.output_material_id
       WHERE po.tenant_id = $1
       ORDER BY po.number DESC`,
      [tenantId],
    );

    return toCsv(
      ['OP Nro.', 'Material producido', 'Código', 'Cant. planif.', 'Cant. real', 'Costo teórico', 'Costo real', 'Estado', 'Inicio', 'Fin'],
      rows.map((r) => [
        r.number, r.output_material, r.material_code,
        fmtNum(r.planned_qty, 4), r.actual_qty != null ? fmtNum(r.actual_qty, 4) : '',
        r.theoretical_cost != null ? fmtNum(r.theoretical_cost) : '',
        r.actual_cost != null ? fmtNum(r.actual_cost) : '',
        r.status, fmtDate(r.started_at), fmtDate(r.completed_at),
      ]),
    );
  }

  async purchasesCsv(tenantId: string): Promise<string> {
    const rows = await this.ds.query<any[]>(
      `SELECT po.number, s.name AS supplier, s.cuit AS supplier_cuit,
              po.status, po.created_at,
              COALESCE(SUM(pol.quantity * pol.unit_price), 0) AS estimated_total
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN purchase_order_lines pol ON pol.purchase_order_id = po.id
       WHERE po.tenant_id = $1
       GROUP BY po.id, s.name, s.cuit
       ORDER BY po.number DESC`,
      [tenantId],
    );

    return toCsv(
      ['OC Nro.', 'Proveedor', 'CUIT proveedor', 'Estado', 'Fecha', 'Total estimado'],
      rows.map((r) => [
        r.number, r.supplier, r.supplier_cuit ?? '',
        r.status, fmtDate(r.created_at), fmtNum(r.estimated_total),
      ]),
    );
  }
}
