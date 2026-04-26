import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { PointOfSale } from './entities/point-of-sale.entity';
import { FiscalCounter } from './entities/fiscal-counter.entity';
import { FISCAL_PROVIDER } from './types/fiscal.types';
import type { IFiscalProvider, FiscalAuthRequest } from './types/fiscal.types';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';
import { CondicionIva } from '../sales/entities/customer.entity';
import { Customer } from '../sales/entities/customer.entity';
import { SalesOrdersService } from '../sales/sales-orders.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLine)
    private readonly lineRepo: Repository<InvoiceLine>,
    @InjectRepository(PointOfSale)
    private readonly posRepo: Repository<PointOfSale>,
    @InjectRepository(FiscalCounter)
    private readonly counterRepo: Repository<FiscalCounter>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @Inject(FISCAL_PROVIDER)
    private readonly fiscalProvider: IFiscalProvider,
    private readonly dataSource: DataSource,
    private readonly salesOrdersService: SalesOrdersService,
  ) {}

  findAll(tenantId: string) {
    return this.invoiceRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    const lines = await this.lineRepo.find({ where: { invoiceId: id, tenantId } });
    return { ...invoice, lines };
  }

  async issue(dto: IssueInvoiceDto, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const pos = await manager.findOne(PointOfSale, {
        where: { number: dto.pointOfSaleNumber, tenantId },
      });
      if (!pos) throw new NotFoundException(`Point of sale ${dto.pointOfSaleNumber} not found`);

      const customer = await manager.findOne(Customer, {
        where: { id: dto.customerId, tenantId },
      });
      if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

      const invoiceType = customer.condicionIva === CondicionIva.RI ? InvoiceType.A : InvoiceType.B;

      // Compute line amounts
      const lines = dto.lines.map((l) => {
        const lineNet = l.quantity * l.unitPrice;
        const lineIva = lineNet * (l.ivaRate / 100);
        return { ...l, netAmount: lineNet, ivaAmount: lineIva };
      });

      const totalNet = lines.reduce((s, l) => s + l.netAmount, 0);
      const totalIva = lines.reduce((s, l) => s + l.ivaAmount, 0);
      const totalAmount = totalNet + totalIva;

      // IVA breakdown grouped by rate
      const rateMap = new Map<number, { netAmount: number; ivaAmount: number }>();
      for (const l of lines) {
        const existing = rateMap.get(l.ivaRate) ?? { netAmount: 0, ivaAmount: 0 };
        rateMap.set(l.ivaRate, {
          netAmount: existing.netAmount + l.netAmount,
          ivaAmount: existing.ivaAmount + l.ivaAmount,
        });
      }
      const ivaBreakdown = Array.from(rateMap.entries()).map(([rate, amounts]) => ({
        rate,
        ...amounts,
      }));

      // Atomic fiscal counter increment via UPSERT
      const counterResult = await manager.query(
        `INSERT INTO fiscal_counters (id, tenant_id, point_of_sale_id, invoice_type, last_number, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 1, NOW(), NOW())
         ON CONFLICT (tenant_id, point_of_sale_id, invoice_type)
         DO UPDATE SET last_number = fiscal_counters.last_number + 1, updated_at = NOW()
         RETURNING last_number`,
        [tenantId, pos.id, invoiceType],
      );
      const invoiceNumber: number = parseInt(counterResult[0].last_number, 10);

      const issueDate = new Date().toISOString().slice(0, 10);

      const authRequest: FiscalAuthRequest = {
        invoiceNumber,
        invoiceType,
        pointOfSaleNumber: pos.number,
        issueDate,
        customerCuit: customer.cuit,
        condicionIva: customer.condicionIva,
        netAmount: totalNet,
        ivaAmount: totalIva,
        totalAmount,
        ivaBreakdown,
      };

      const authResult = await this.fiscalProvider.authorize(authRequest);

      const invoice = manager.create(Invoice, {
        tenantId,
        pointOfSaleId: pos.id,
        customerId: customer.id,
        salesOrderId: dto.salesOrderId ?? null,
        invoiceType,
        invoiceNumber,
        netAmount: totalNet,
        ivaAmount: totalIva,
        totalAmount,
        status: InvoiceStatus.AUTHORIZED,
        cae: authResult.cae,
        caeExpiresOn: authResult.caeExpiresOn,
        afipRequest: authResult.afipRequest,
        afipResponse: authResult.afipResponse,
        issuedAt: new Date(),
      });
      const savedInvoice = await manager.save(Invoice, invoice);

      const invoiceLines = lines.map((l) =>
        manager.create(InvoiceLine, {
          tenantId,
          invoiceId: savedInvoice.id,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          ivaRate: l.ivaRate,
          netAmount: parseFloat(l.netAmount.toFixed(2)),
          ivaAmount: parseFloat(l.ivaAmount.toFixed(2)),
        }),
      );
      await manager.save(InvoiceLine, invoiceLines);

      if (dto.salesOrderId) {
        await this.salesOrdersService.markInvoiced(dto.salesOrderId, tenantId);
      }

      return { ...savedInvoice, lines: invoiceLines };
    });
  }
}
