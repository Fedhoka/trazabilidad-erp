import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface FixedCost {
  id: string;
  name: string;
  category: string | null;
  /** Returned as a string by the API (decimal column). Parse with Number() in callers. */
  amount: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FixedCostPayload {
  name: string;
  category?: string;
  amount: number;
  isActive?: boolean;
  notes?: string;
}

const KEY = 'fixed-costs';

export function useFixedCosts() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => apiFetch<FixedCost[]>('/fixed-costs'),
  });
}

export function useCreateFixedCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FixedCostPayload) =>
      apiFetch<FixedCost>('/fixed-costs', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      // Break-even depends on this — invalidate it too so the page recomputes.
      qc.invalidateQueries({ queryKey: ['dashboard', 'break-even'] });
    },
  });
}

export function useUpdateFixedCost(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<FixedCostPayload>) =>
      apiFetch<FixedCost>(`/fixed-costs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'break-even'] });
    },
  });
}

export function useArchiveFixedCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/fixed-costs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'break-even'] });
    },
  });
}
