import { Controller, Get, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

function csvResponse(res: Response, filename: string, csv: string) {
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send('\uFEFF' + csv); // BOM so Excel opens UTF-8 correctly
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('stock.csv')
  async stock(@Request() req: any, @Res() res: Response) {
    const csv = await this.service.stockCsv(req.user.tenantId);
    csvResponse(res, 'stock.csv', csv);
  }

  @Get('invoices.csv')
  async invoices(@Request() req: any, @Res() res: Response) {
    const csv = await this.service.invoicesCsv(req.user.tenantId);
    csvResponse(res, 'facturas.csv', csv);
  }

  @Get('production-costs.csv')
  async productionCosts(@Request() req: any, @Res() res: Response) {
    const csv = await this.service.productionCostsCsv(req.user.tenantId);
    csvResponse(res, 'costos-produccion.csv', csv);
  }

  @Get('purchases.csv')
  async purchases(@Request() req: any, @Res() res: Response) {
    const csv = await this.service.purchasesCsv(req.user.tenantId);
    csvResponse(res, 'compras.csv', csv);
  }
}
