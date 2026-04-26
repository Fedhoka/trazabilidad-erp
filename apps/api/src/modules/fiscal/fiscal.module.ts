import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PointOfSale } from './entities/point-of-sale.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { FiscalCounter } from './entities/fiscal-counter.entity';
import { PointsOfSaleService } from './points-of-sale.service';
import { PointsOfSaleController } from './points-of-sale.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { FISCAL_PROVIDER } from './types/fiscal.types';
import { MockFiscalProvider } from './providers/mock-fiscal.provider';
import { ArcaFiscalProvider } from './providers/arca-fiscal.provider';
import { SalesModule } from '../sales/sales.module';
import { InvoicePdfService } from './pdf/invoice-pdf.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([PointOfSale, Invoice, InvoiceLine, FiscalCounter]),
    SalesModule,
  ],
  controllers: [PointsOfSaleController, InvoicesController],
  providers: [
    PointsOfSaleService,
    InvoicesService,
    InvoicePdfService,
    {
      provide: FISCAL_PROVIDER,
      useFactory: (config: ConfigService) => {
        const afipEnv = config.get<string>('AFIP_ENV', 'mock');
        if (afipEnv === 'mock') return new MockFiscalProvider();
        return new ArcaFiscalProvider({
          certPath: config.getOrThrow<string>('AFIP_CERT_PATH'),
          keyPath: config.getOrThrow<string>('AFIP_KEY_PATH'),
          cuit: config.getOrThrow<string>('AFIP_CUIT'),
          env: afipEnv as 'homologacion' | 'produccion',
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [TypeOrmModule],
})
export class FiscalModule {}
