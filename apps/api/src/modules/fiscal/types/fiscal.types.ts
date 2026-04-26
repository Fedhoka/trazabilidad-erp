import { InvoiceType } from '../entities/invoice.entity';
import { CondicionIva } from '../../sales/entities/customer.entity';

export interface FiscalAuthRequest {
  invoiceNumber: number;
  invoiceType: InvoiceType;
  pointOfSaleNumber: number;
  issueDate: string;
  customerCuit: string | null;
  condicionIva: CondicionIva;
  netAmount: number;
  ivaAmount: number;
  totalAmount: number;
  ivaBreakdown: Array<{ rate: number; netAmount: number; ivaAmount: number }>;
}

export interface FiscalAuthResult {
  cae: string;
  caeExpiresOn: Date;
  afipRequest: object;
  afipResponse: object;
}

export interface IFiscalProvider {
  authorize(request: FiscalAuthRequest): Promise<FiscalAuthResult>;
}

export const FISCAL_PROVIDER = 'FISCAL_PROVIDER';
