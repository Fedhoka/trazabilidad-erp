import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export interface DashboardKpis {
  availableLots: number;
  stockValue: number;
  pendingPos: number;
  openSalesOrders: number;
  inProgressOrders: number;
  monthInvoiceCount: number;
  monthInvoiceTotal: number;
  expiringSoon: number;
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

// ── Time-series stats for charts ───────────────────────────────────────────
export interface MonthlyStatPoint {
  month: string; // YYYY-MM
  revenue: number;
  invoiceCount: number;
  costs: number;
  unitsProduced: number;
  purchases: number;
  margin: number;
}

export interface DashboardStats {
  months: MonthlyStatPoint[];
  totals: {
    revenue: number;
    costs: number;
    margin: number;
    invoiceCount: number;
    unitsProduced: number;
    purchases: number;
  };
  marginPercent: number;
}

export function useDashboardStats(months = 12) {
  return useQuery({
    queryKey: ['dashboard', 'stats', months],
    queryFn: () =>
      apiFetch<DashboardStats>(`/dashboard/stats?months=${months}`),
  });
}

// ── Inventory analytics ───────────────────────────────────────────────────
export type MaterialKind = 'RAW' | 'PACKAGING' | 'WIP' | 'FINISHED';

export interface StockByKindEntry {
  kind: MaterialKind;
  value: number;
  lots: number;
  units: number;
}

export interface LowStockEntry {
  id: string;
  code: string;
  name: string;
  kind: MaterialKind;
  baseUom: string;
  available: number;
}

export interface ExpiringDayEntry {
  date: string; // YYYY-MM-DD
  count: number;
  value: number;
}

export interface InventoryAnalytics {
  stockByKind: StockByKindEntry[];
  lowStock: LowStockEntry[];
  expiringByDay: ExpiringDayEntry[];
  expiringBuckets: {
    within7: number;
    within14: number;
    within30: number;
    value7: number;
    value14: number;
    value30: number;
  };
}

export function useInventoryAnalytics() {
  return useQuery({
    queryKey: ['dashboard', 'inventory-analytics'],
    queryFn: () =>
      apiFetch<InventoryAnalytics>('/dashboard/inventory-analytics'),
  });
}

// ── Sales analytics ──────────────────────────────────────────────────────
export type CondicionIva = 'RI' | 'CF' | 'MONO' | 'EXENTO';

export interface TopCustomerEntry {
  id: string;
  name: string;
  condicionIva: CondicionIva;
  revenue: number;
  invoiceCount: number;
}

export interface TopProductEntry {
  id: string;
  code: string;
  name: string;
  units: number;
  revenue: number;
}

export interface CondicionIvaEntry {
  condicionIva: CondicionIva;
  customers: number;
  revenue: number;
  invoiceCount: number;
}

export interface SalesAnalytics {
  topCustomers: TopCustomerEntry[];
  topProducts: TopProductEntry[];
  byCondicionIva: CondicionIvaEntry[];
  ticket: {
    totalRevenue: number;
    invoiceCount: number;
    average: number;
  };
}

export function useSalesAnalytics() {
  return useQuery({
    queryKey: ['dashboard', 'sales-analytics'],
    queryFn: () => apiFetch<SalesAnalytics>('/dashboard/sales-analytics'),
  });
}

export function useInventoryLots(includeExpired = false, page = 1) {
  return useQuery({
    queryKey: ['inventory', 'lots', includeExpired, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (includeExpired) params.set('includeExpired', 'true');
      return apiFetch<PaginatedResponse<InventoryLot>>(`/inventory/lots?${params}`);
    },
  });
}

export function useExpiringSoon() {
  return useQuery({
    queryKey: ['inventory', 'expiring-soon'],
    queryFn: () => apiFetch<InventoryLot[]>('/inventory/expiring-soon'),
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
