import {
  Body, Controller, Get, Param, ParseUUIDPipe, Post, Request, Res, StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly service: InvoicesService,
    private readonly pdfService: InvoicePdfService,
  ) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.tenantId);
  }

  @Get(':id/pdf')
  async getPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buf = await this.pdfService.generate(id, req.user.tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${id}.pdf"`,
      'Content-Length': buf.length,
    });
    return new StreamableFile(buf);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post()
  issue(@Body() dto: IssueInvoiceDto, @Request() req: any) {
    return this.service.issue(dto, req.user.tenantId);
  }
}
