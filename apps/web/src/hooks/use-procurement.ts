import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type POStatus = 'DRAFT' | 'APPROVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED';
export type QcStatus = 'PASS' | 'FAIL' | 'PENDING';

export interface POLine {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
}

export interface PurchaseOrder {
  id: string;
  number: number;
  supplierId: string;
  status: POStatus;
  notes: string | null;
  createdAt: string;
  lines: POLine[];
}

export interface CreatePOPayload {
  supplierId: string;
  notes?: string;
  lines: { materialId: string; quantity: number; unitPrice: number }[];
}

export interface ReceiptLinePayload {
  purchaseOrderLineId: string;
  quantity: number;
  unitCost: number;
  lotCode: string;
  expiresOn?: string;
  qcStatus: QcStatus;
  qcNotes?: string;
}

export interface CreateReceiptPayload {
  purchaseOrderId: string;
  receivedAt?: string;
  notes?: string;
  lines: ReceiptLinePayload[];
}

const PO_KEY = ['purchase-orders'];
const poKey = (id: string) => ['purchase-orders', id];

export function usePurchaseOrders() {
  return useQuery({
    queryKey: PO_KEY,
    queryFn: () => apiFetch<PurchaseOrder[]>('/purchase-orders'),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: poKey(id),
    queryFn: () => apiFetch<PurchaseOrder>(`/purchase-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePOPayload) =>
      apiFetch<PurchaseOrder>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PO_KEY }),
  });
}

export function useApprovePO(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<PurchaseOrder>(`/purchase-orders/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PO_KEY });
      qc.invalidateQueries({ queryKey: poKey(id) });
    },
  });
}

export function useCancelPO(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<PurchaseOrder>(`/purchase-orders/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PO_KEY });
      qc.invalidateQueries({ queryKey: poKey(id) });
    },
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReceiptPayload) =>
      apiFetch('/goods-receipts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: PO_KEY });
      qc.invalidateQueries({ queryKey: poKey(vars.purchaseOrderId) });
    },
  });
}
