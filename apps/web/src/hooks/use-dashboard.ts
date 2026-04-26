import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface DashboardKpis {
  availableLots: number;
  stockValue: number;
  pendingPos: number;
  openSalesOrders: number;
  inProgressOrders: number;
  monthInvoiceCount: number;
  monthInvoiceTotal: number;
}

export interface InventoryLot {
  id: string;
  lotCode: string;
  quantity: string;
  unitCost: string;
  status: string;
  expiresOn: string | null;
  receivedAt: string;
  materialName: string;
  materialCode: string;
  baseUom: string;
  locationName: string | null;
  locationCode: string | null;
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => apiFetch<DashboardKpis>('/dashboard/kpis'),
  });
}

export function useInventoryLots() {
  return useQuery({
    queryKey: ['inventory', 'lots'],
    queryFn: () => apiFetch<InventoryLot[]>('/inventory/lots'),
  });
}

export function useUpdateLotStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/inventory/lots/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'lots'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'kpis'] });
    },
  });
}
