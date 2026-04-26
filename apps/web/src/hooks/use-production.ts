import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type RecipeStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type POStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface RecipeComponent {
  id: string;
  materialId: string;
  qtyPerBatch: number;
  lossPct: number;
}

export interface Recipe {
  id: string;
  name: string;
  outputMaterialId: string;
  outputQty: number;
  batchSizeUom: string;
  status: RecipeStatus;
  version: number;
  notes: string | null;
  components?: RecipeComponent[];
}

export interface ProductionOrder {
  id: string;
  number: number;
  recipeId: string;
  outputMaterialId: string;
  plannedQty: number;
  actualQty: number | null;
  status: POStatus;
  theoreticalCost: number | null;
  actualCost: number | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateRecipePayload {
  name: string;
  outputMaterialId: string;
  outputQty: number;
  batchSizeUom: string;
  notes?: string;
  components: { materialId: string; qtyPerBatch: number; lossPct?: number }[];
}

const REC_KEY = ['recipes'];
const PO_KEY = ['production-orders'];
const recKey = (id: string) => ['recipes', id];
const poKey = (id: string) => ['production-orders', id];

export function useRecipes() {
  return useQuery({ queryKey: REC_KEY, queryFn: () => apiFetch<Recipe[]>('/recipes') });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: recKey(id),
    queryFn: () => apiFetch<Recipe>(`/recipes/${id}`),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecipePayload) =>
      apiFetch<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: REC_KEY }),
  });
}

export function useActivateRecipe(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<Recipe>(`/recipes/${id}/activate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: REC_KEY }),
  });
}

export function useArchiveRecipe(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<Recipe>(`/recipes/${id}/archive`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: REC_KEY }),
  });
}

export function useProductionOrders() {
  return useQuery({
    queryKey: PO_KEY,
    queryFn: () => apiFetch<ProductionOrder[]>('/production-orders'),
  });
}

export function useProductionOrder(id: string) {
  return useQuery({
    queryKey: poKey(id),
    queryFn: () => apiFetch<ProductionOrder>(`/production-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { recipeId: string; plannedQty: number; notes?: string }) =>
      apiFetch<ProductionOrder>('/production-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PO_KEY }),
  });
}

export function useStartPO(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<ProductionOrder>(`/production-orders/${id}/start`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PO_KEY });
      qc.invalidateQueries({ queryKey: poKey(id) });
    },
  });
}

export function useRecordConsumption(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { materialLotId: string; quantity: number }) =>
      apiFetch(`/production-orders/${id}/consume`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKey(id) }),
  });
}

export function useCompletePO(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { actualQty: number; lotCode: string; expiresOn?: string; notes?: string }) =>
      apiFetch<ProductionOrder>(`/production-orders/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PO_KEY });
      qc.invalidateQueries({ queryKey: poKey(id) });
    },
  });
}

export function useCancelPO(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<ProductionOrder>(`/production-orders/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PO_KEY });
      qc.invalidateQueries({ queryKey: poKey(id) });
    },
  });
}

export function useTraceability(lotId: string, direction: 'full' | 'backward' | 'forward') {
  return useQuery({
    queryKey: ['traceability', lotId, direction],
    queryFn: () => apiFetch<unknown>(`/traceability/${lotId}/${direction}`),
    enabled: !!lotId,
  });
}
