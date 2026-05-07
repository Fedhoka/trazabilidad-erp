import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export interface PointOfSale {
  id: string;
  number: number;
  name: string;
  isActive: boolean;
}

export type InvoiceType = 'A' | 'B' | 'C';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'MERCADOPAGO'
  | 'CHECK'
  | 'CURRENT_ACCOUNT'
  | 'OTHER';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  DEBIT_CARD: 'Débito',
  CREDIT_CARD: 'Crédito',
  MERCADOPAGO: 'MercadoPago',
  CHECK: 'Cheque',
  CURRENT_ACCOUNT: 'Cuenta corriente',
  OTHER: 'Otro',
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  A: 'Factura A',
  B: 'Factura B',
  C: 'Factura C',
};

export interface Invoice {
  id: string;
  invoiceType: InvoiceType;
  invoiceNumber: number;
  pointOfSaleId: string;
  customerId: string;
  salesOrderId: string | null;
  netAmount: number;
  ivaAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'AUTHORIZED' | 'REJECTED' | 'CANCELLED';
  cae: string | null;
  caeExpiresOn: string | null;
  issuedAt: string | null;
  paymentMethod: PaymentMethod;
}

export interface IssueInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  ivaRate: 0 | 10.5 | 21;
}

export interface IssueInvoicePayload {
  pointOfSaleNumber: number;
  customerId: string;
  salesOrderId?: string;
  /** Optional manual override. Defaults to derived-from-customer-IVA on the server. */
  invoiceType?: InvoiceType;
  /** Defaults to OTHER on the server when not provided. */
  paymentMethod?: PaymentMethod;
  lines: IssueInvoiceLine[];
}

const POS_KEY = ['points-of-sale'];
const INV_KEY = 'invoices';

export function usePointsOfSale() {
  return useQuery({ queryKey: POS_KEY, queryFn: () => apiFetch<PointOfSale[]>('/points-of-sale') });
}

export function useCreatePointOfSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { number: number; name: string }) =>
      apiFetch<PointOfSale>('/points-of-sale', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: POS_KEY }),
  });
}

export function useInvoices(page = 1) {
  return useQuery({
    queryKey: [INV_KEY, page],
    queryFn: () => apiFetch<PaginatedResponse<Invoice>>(`/invoices?page=${page}&limit=25`),
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IssueInvoicePayload) =>
      apiFetch<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INV_KEY] });
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'sales-analytics'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'kpis'] });
    },
  });
}
