import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { InvoiceType } from '../entities/invoice.entity';

const CBTE_TIPO: Record<InvoiceType, number> = {
  [InvoiceType.A]: 1,
  [InvoiceType.B]: 6,
  [InvoiceType.C]: 11,
};

const CONDICION_IVA_LABEL: Record<string, string> = {
  RI: 'Responsable Inscripto',
  CF: 'Consumidor Final',
  MONO: 'Monotributista',
  EXENTO: 'Exento',
};

const AR = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

@Injectable()
export class InvoicePdfService {
  private readonly issuerCuit: string;
  private readonly companyAddress: string;

  constructor(
    private readonly ds: DataSource,
    private readonly config: ConfigService,
  ) {
    this.issuerCuit = config.get<string>('AFIP_CUIT', '');
    this.companyAddress = config.get<string>('COMPANY_ADDRESS', '');
  }

  async generate(invoiceId: string, tenantId: string): Promise<Buffer> {
    const data = await this.loadData(invoiceId, tenantId);
    const qrBuf = await this.buildQr(data);
    return this.buildPdf(data, qrBuf);
  }

  // ── data ────────────────────────────────────────────────────────────────────

  private async loadData(invoiceId: string, tenantId: string) {
    const rows = await this.ds.query<any[]>(
      `SELECT
         i.id, i.invoice_type, i.invoice_number, i.net_amount, i.iva_amount,
         i.total_amount, i.status, i.cae, i.cae_expires_on, i.issued_at,
         pos.number AS pos_number,
         c.name AS customer_name, c.cuit AS customer_cuit,
         c.condicion_iva AS customer_condicion_iva, c.address AS customer_address,
         t.name AS tenant_name
       FROM invoices i
       JOIN points_of_sale pos ON pos.id = i.point_of_sale_id
       JOIN customers c ON c.id = i.customer_id
       JOIN tenants t ON t.id = $2
       WHERE i.id = $1 AND i.tenant_id = $2`,
      [invoiceId, tenantId],
    );

    if (!rows.length) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    const inv = rows[0];

    const lines = await this.ds.query<any[]>(
      `SELECT description, quantity, unit_price, iva_rate, net_amount, iva_amount
       FROM invoice_lines
       WHERE invoice_id = $1
       ORDER BY created_at`,
      [invoiceId],
    );

    return { inv, lines };
  }

  // ── QR code ─────────────────────────────────────────────────────────────────

  private async buildQr({ inv }: { inv: any }): Promise<Buffer> {
    const cuitNum = this.issuerCuit ? parseInt(this.issuerCuit.replace(/-/g, ''), 10) : 0;
    const customerCuitNum = inv.customer_cuit
      ? parseInt(String(inv.customer_cuit).replace(/-/g, ''), 10)
      : 0;
    const docTipo = customerCuitNum ? 80 : 99;
    const fecha = inv.issued_at
      ? new Date(inv.issued_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const payload = JSON.stringify({
      ver: 1,
      fecha,
      cuit: cuitNum,
      ptoVta: Number(inv.pos_number),
      tipoCmp: CBTE_TIPO[inv.invoice_type as InvoiceType] ?? 6,
      nroCmp: Number(inv.invoice_number),
      importe: Number(inv.total_amount),
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: docTipo,
      nroDocRec: customerCuitNum,
      tipoCodAut: 'E',
      codAut: inv.cae ? Number(inv.cae) : 0,
    });

    const url = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(payload).toString('base64url')}`;
    return QRCode.toBuffer(url, { width: 80, margin: 1 });
  }

  // ── PDF layout ───────────────────────────────────────────────────────────────

  private buildPdf(
    { inv, lines }: { inv: any; lines: any[] },
    qrBuf: Buffer,
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const W = 515; // usable width
      const L = 40;  // left margin
      const boxSize = 80;

      // ── header ──────────────────────────────────────────────────────────────
      // Left: issuer info
      doc.fontSize(14).font('Helvetica-Bold').text(inv.tenant_name, L, 40, { width: 200 });
      doc.fontSize(9).font('Helvetica');
      if (this.issuerCuit) doc.text(`CUIT: ${this.issuerCuit}`, L, doc.y + 2, { width: 200 });
      if (this.companyAddress) doc.text(this.companyAddress, L, doc.y + 2, { width: 200 });
      doc.text('Responsable Inscripto', L, doc.y + 2, { width: 200 });

      // Center: letter box
      const boxX = L + (W - boxSize) / 2;
      doc.rect(boxX, 40, boxSize, boxSize).stroke();
      doc.fontSize(42).font('Helvetica-Bold').text(
        inv.invoice_type,
        boxX, 48,
        { width: boxSize, align: 'center' },
      );
      doc.fontSize(8).font('Helvetica').text(
        'Cód. ' + (CBTE_TIPO[inv.invoice_type as InvoiceType] ?? ''),
        boxX, 108,
        { width: boxSize, align: 'center' },
      );

      // Right: document info
      const rX = L + W - 210;
      doc.fontSize(16).font('Helvetica-Bold').text('FACTURA', rX, 40, { width: 210, align: 'right' });
      doc.fontSize(9).font('Helvetica');
      const posStr = String(inv.pos_number).padStart(4, '0');
      const numStr = String(inv.invoice_number).padStart(8, '0');
      doc.text(`Pto. Venta: ${posStr}   Nro: ${numStr}`, rX, doc.y + 4, { width: 210, align: 'right' });
      const dateStr = inv.issued_at
        ? new Date(inv.issued_at).toLocaleDateString('es-AR')
        : new Date().toLocaleDateString('es-AR');
      doc.text(`Fecha de emisión: ${dateStr}`, rX, doc.y + 2, { width: 210, align: 'right' });

      const afterHeader = Math.max(doc.y, 130);
      doc.moveTo(L, afterHeader + 6).lineTo(L + W, afterHeader + 6).stroke();

      // ── customer ────────────────────────────────────────────────────────────
      const custY = afterHeader + 14;
      doc.fontSize(9).font('Helvetica-Bold').text('Cliente:', L, custY);
      doc.font('Helvetica').text(inv.customer_name, L + 45, custY);
      doc.text(
        `CUIT: ${inv.customer_cuit ?? 'N/A'}   Cond. IVA: ${CONDICION_IVA_LABEL[inv.customer_condicion_iva] ?? inv.customer_condicion_iva}`,
        L, custY + 14,
      );
      if (inv.customer_address) {
        doc.text(`Dirección: ${inv.customer_address}`, L, custY + 26);
      }

      const afterCust = custY + (inv.customer_address ? 44 : 32);
      doc.moveTo(L, afterCust).lineTo(L + W, afterCust).stroke();

      // ── items table ─────────────────────────────────────────────────────────
      const tableY = afterCust + 10;
      const cols = { desc: L, qty: L + 245, price: L + 305, iva: L + 375, sub: L + 420 };
      const colW = { desc: 240, qty: 55, price: 65, iva: 40, sub: 95 };

      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('Descripción', cols.desc, tableY, { width: colW.desc });
      doc.text('Cantidad', cols.qty, tableY, { width: colW.qty, align: 'right' });
      doc.text('P. Unit.', cols.price, tableY, { width: colW.price, align: 'right' });
      doc.text('IVA %', cols.iva, tableY, { width: colW.iva, align: 'right' });
      doc.text('Subtotal', cols.sub, tableY, { width: colW.sub, align: 'right' });

      let rowY = tableY + 14;
      doc.moveTo(L, rowY - 3).lineTo(L + W, rowY - 3).stroke();

      doc.font('Helvetica').fontSize(8);
      for (const line of lines) {
        const lineH = 14;
        doc.text(line.description, cols.desc, rowY, { width: colW.desc });
        doc.text(
          Number(line.quantity).toLocaleString('es-AR', { maximumFractionDigits: 4 }),
          cols.qty, rowY, { width: colW.qty, align: 'right' },
        );
        doc.text(AR.format(Number(line.unit_price)), cols.price, rowY, { width: colW.price, align: 'right' });
        doc.text(AR.format(Number(line.iva_rate)) + '%', cols.iva, rowY, { width: colW.iva, align: 'right' });
        doc.text(
          AR.format(Number(line.net_amount) + Number(line.iva_amount)),
          cols.sub, rowY, { width: colW.sub, align: 'right' },
        );
        rowY += lineH;
      }

      doc.moveTo(L, rowY + 4).lineTo(L + W, rowY + 4).stroke();

      // ── totals ──────────────────────────────────────────────────────────────
      const tX = L + W - 200;
      let tY = rowY + 14;
      doc.fontSize(8).font('Helvetica');
      doc.text('Neto gravado:', tX, tY, { width: 110 });
      doc.text(`$ ${AR.format(Number(inv.net_amount))}`, tX + 115, tY, { width: 85, align: 'right' });

      tY += 14;
      doc.text('IVA:', tX, tY, { width: 110 });
      doc.text(`$ ${AR.format(Number(inv.iva_amount))}`, tX + 115, tY, { width: 85, align: 'right' });

      tY += 14;
      doc.moveTo(tX, tY).lineTo(tX + 200, tY).stroke();
      tY += 6;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('TOTAL:', tX, tY, { width: 110 });
      doc.text(`$ ${AR.format(Number(inv.total_amount))}`, tX + 115, tY, { width: 85, align: 'right' });

      // ── CAE footer ──────────────────────────────────────────────────────────
      const footerY = Math.max(tY + 40, rowY + 100);
      doc.moveTo(L, footerY).lineTo(L + W, footerY).stroke();

      doc.fontSize(8).font('Helvetica-Bold').text('CAE:', L, footerY + 8);
      doc.font('Helvetica').text(inv.cae ?? 'PENDIENTE', L + 30, footerY + 8);

      if (inv.cae_expires_on) {
        const expStr = new Date(inv.cae_expires_on).toLocaleDateString('es-AR');
        doc.font('Helvetica-Bold').text('  Vto. CAE:', L + 170, footerY + 8, { continued: true });
        doc.font('Helvetica').text(`  ${expStr}`);
      }

      // QR code
      doc.image(qrBuf, L + W - 80, footerY + 4, { width: 80 });

      doc.end();
    });
  }
}
