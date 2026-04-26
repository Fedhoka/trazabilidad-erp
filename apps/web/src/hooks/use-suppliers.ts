import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export interface Supplier {
  id: string;
  name: string;
  cuit: string | null;
  address: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
}

export interface SupplierPayload {
  name: string;
  cuit?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

const KEY = 'suppliers';

export function useSuppliers(page = 1) {
  return useQuery({
    queryKey: [KEY, page],
    queryFn: () => apiFetch<PaginatedResponse<Supplier>>(`/suppliers?page=${page}&limit=25`),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierPayload) =>
      apiFetch<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupplierPayload>) =>
      apiFetch<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
