import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export type SOStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'INVOICED' | 'CANCELLED';

export interface SOLine {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  number: number;
  customerId: string;
  status: SOStatus;
  notes: string | null;
  createdAt: string;
  lines: SOLine[];
}

export interface CreateSOPayload {
  customerId: string;
  notes?: string;
  lines: { materialId: string; quantity: number; unitPrice: number }[];
}

const SO_KEY = 'sales-orders';
const soKey = (id: string) => [SO_KEY, id];

export function useSalesOrders(page = 1) {
  return useQuery({
    queryKey: [SO_KEY, page],
    queryFn: () => apiFetch<PaginatedResponse<SalesOrder>>(`/sales-orders?page=${page}&limit=25`),
  });
}

export function useSalesOrder(id: string) {
  return useQuery({
    queryKey: soKey(id),
    queryFn: () => apiFetch<SalesOrder>(`/sales-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSOPayload) =>
      apiFetch<SalesOrder>('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SO_KEY] }),
  });
}

export function useConfirmSO(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<SalesOrder>(`/sales-orders/${id}/confirm`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SO_KEY] });
      qc.invalidateQueries({ queryKey: soKey(id) });
    },
  });
}

export function useCancelSO(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<SalesOrder>(`/sales-orders/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SO_KEY] });
      qc.invalidateQueries({ queryKey: soKey(id) });
    },
  });
}
