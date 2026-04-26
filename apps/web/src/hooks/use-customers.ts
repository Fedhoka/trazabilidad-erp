import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export type CondicionIva = 'RI' | 'CF' | 'MONO' | 'EXENTO';

export const CONDICION_IVA_LABELS: Record<CondicionIva, string> = {
  RI: 'Resp. Inscripto',
  CF: 'Consumidor Final',
  MONO: 'Monotributista',
  EXENTO: 'Exento',
};

export interface Customer {
  id: string;
  name: string;
  cuit: string | null;
  condicionIva: CondicionIva;
  address: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
}

export interface CustomerPayload {
  name: string;
  cuit?: string;
  condicionIva: CondicionIva;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

const KEY = 'customers';

export function useCustomers(page = 1) {
  return useQuery({
    queryKey: [KEY, page],
    queryFn: () => apiFetch<PaginatedResponse<Customer>>(`/customers?page=${page}&limit=25`),
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerPayload) =>
      apiFetch<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CustomerPayload>) =>
      apiFetch<Customer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
