import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export type UserRole =
  | 'OWNER' | 'PROCUREMENT' | 'PRODUCTION' | 'QC'
  | 'SALES' | 'FINANCE' | 'OPERATOR';

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Propietario',
  PROCUREMENT: 'Compras',
  PRODUCTION: 'Producción',
  QC: 'Control de calidad',
  SALES: 'Ventas',
  FINANCE: 'Finanzas',
  OPERATOR: 'Operador',
};

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
}

export interface InviteUserPayload {
  email: string;
  password: string;
  role: UserRole;
}

export function useUsers(page = 1) {
  return useQuery({
    queryKey: ['users', page],
    queryFn: () => apiFetch<PaginatedResponse<AppUser>>(`/users?page=${page}&limit=25`),
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteUserPayload) =>
      apiFetch<AppUser>('/users', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }), // invalidates all pages
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      apiFetch<AppUser>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }), // invalidates all pages
  });
}

export function useSetActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<AppUser>(`/users/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }), // invalidates all pages
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      apiFetch('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  });
}
