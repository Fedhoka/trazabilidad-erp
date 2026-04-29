'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';
import {
  useUsers, useInviteUser, useUpdateRole, useSetActive, useChangePassword,
  ROLE_LABELS, type UserRole, type AppUser,
} from '@/hooks/use-users';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const ROLES = Object.entries(ROLE_LABELS) as [UserRole, string][];

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.string().min(1),
});
type InviteForm = z.infer<typeof inviteSchema>;

function InviteDialog({ onClose }: { onClose: () => void }) {
  const invite = useInviteUser();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<InviteForm>({ resolver: zodResolver(inviteSchema), defaultValues: { role: 'OPERATOR' } });

  async function onSubmit(v: InviteForm) {
    try {
      await invite.mutateAsync({ email: v.email, password: v.password, role: v.role as UserRole });
      toast.success('Usuario invitado');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Email *</Label>
        <Input type="email" {...register('email')} placeholder="usuario@empresa.com" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Contraseña temporal *</Label>
        <Input type="password" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Rol *</Label>
        <Select defaultValue="OPERATOR" onValueChange={(v) => v && setValue('role', v)}>
          <SelectTrigger>
            <SelectValue getLabel={(v) => ROLE_LABELS[v as UserRole] ?? String(v)} />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando…' : 'Invitar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RoleCell({ user, isOwner }: { user: AppUser; isOwner: boolean }) {
  const updateRole = useUpdateRole();

  if (!isOwner) {
    return <span className="text-sm">{ROLE_LABELS[user.role] ?? user.role}</span>;
  }

  return (
    <Select
      value={user.role}
      onValueChange={(v) => {
        if (!v) return;
        updateRole.mutate(
          { id: user.id, role: v as UserRole },
          { onError: () => toast.error('No se pudo cambiar el rol') },
        );
      }}
    >
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue getLabel={(v) => ROLE_LABELS[v as UserRole] ?? String(v)} />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map(([value, label]) => (
          <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const { data: result, isLoading } = useUsers(page);
  const setActive = useSetActive();
  const [inviteOpen, setInviteOpen] = useState(false);

  const isOwner = currentUser?.role === 'OWNER';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuarios"
        description="Miembros del equipo, roles asignados y acceso al sistema."
        actions={
          isOwner ? (
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Invitar usuario
            </Button>
          ) : null
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Desde</TableHead>
              {isOwner && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: isOwner ? 5 : 4 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && result?.data.map((u) => (
              <TableRow key={u.id} className={!u.isActive ? 'opacity-50' : ''}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell><RoleCell user={u} isOwner={isOwner} /></TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'default' : 'secondary'}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('es-AR')}
                </TableCell>
                {isOwner && u.id !== currentUser?.id && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      disabled={setActive.isPending}
                      onClick={() =>
                        setActive.mutate(
                          { id: u.id, active: !u.isActive },
                          { onError: () => toast.error('Error al actualizar') },
                        )
                      }
                    >
                      {u.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                )}
                {isOwner && u.id === currentUser?.id && <TableCell />}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        totalPages={result?.meta.totalPages ?? 1}
        total={result?.meta.total ?? 0}
        onPageChange={setPage}
      />

      <Separator />
      <ChangePasswordSection />

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
          </DialogHeader>
          <InviteDialog onClose={() => setInviteOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Requerido'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
type PwForm = z.infer<typeof pwSchema>;

function ChangePasswordSection() {
  const changePassword = useChangePassword();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  async function onSubmit(v: PwForm) {
    try {
      await changePassword.mutateAsync({ currentPassword: v.currentPassword, newPassword: v.newPassword });
      toast.success('Contraseña actualizada');
      reset();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <div className="max-w-sm space-y-3">
      <h2 className="text-base font-semibold">Cambiar contraseña</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Contraseña actual</Label>
          <Input type="password" {...register('currentPassword')} />
          {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Nueva contraseña</Label>
          <Input type="password" {...register('newPassword')} />
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Confirmar nueva contraseña</Label>
          <Input type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
        </Button>
      </form>
    </div>
  );
}
