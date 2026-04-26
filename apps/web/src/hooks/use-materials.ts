import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export type MaterialKind = 'RAW' | 'PACKAGING' | 'WIP' | 'FINISHED';

export interface Material {
  id: string;
  name: string;
  code: string;
  kind: MaterialKind;
  baseUom: string;
  shelfLifeDays: number | null;
  avgCost: number;
  isActive: boolean;
}

export interface MaterialPayload {
  name: string;
  code: string;
  kind: MaterialKind;
  baseUom: string;
  shelfLifeDays?: number;
}

const KEY = 'materials';

export function useMaterials(page = 1) {
  return useQuery({
    queryKey: [KEY, page],
    queryFn: () => apiFetch<PaginatedResponse<Material>>(`/materials?page=${page}&limit=25`),
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaterialPayload) =>
      apiFetch<Material>('/materials', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMaterial(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaterialPayload>) =>
      apiFetch<Material>(`/materials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
