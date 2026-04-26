import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const KEY = 'audit-logs';

export function useAuditLogs(page = 1) {
  return useQuery({
    queryKey: [KEY, page],
    queryFn: () => apiFetch<PaginatedResponse<AuditLog>>(`/audit-logs?page=${page}&limit=25`),
  });
}
