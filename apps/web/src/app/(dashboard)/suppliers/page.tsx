'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Pencil } from 'lucide-react';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  type Supplier,
} from '@/hooks/use-suppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  cuit: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function SupplierForm({
  defaultValues,
  supplierId,
  onClose,
}: {
  defaultValues?: Partial<FormValues>;
  supplierId?: string;
  onClose: () => void;
}) {
  const create = useCreateSupplier();
  const update = useUpdateSupplier(supplierId ?? '');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      ...(values.cuit ? { cuit: values.cuit } : {}),
      ...(values.address ? { address: values.address } : {}),
      ...(values.contactName ? { contactName: values.contactName } : {}),
      ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
      ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
    };
    try {
      if (supplierId) {
        await update.mutateAsync(payload);
        toast.success('Proveedor actualizado');
      } else {
        await create.mutateAsync(payload);
        toast.success('Proveedor creado');
      }
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Nombre *</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>CUIT</Label>
          <Input {...register('cuit')} placeholder="20-12345678-9" />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input {...register('contactPhone')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Dirección</Label>
        <Input {...register('address')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Contacto</Label>
          <Input {...register('contactName')} />
        </div>
        <div className="space-y-1.5">
          <Label>Email contacto</Label>
          <Input type="email" {...register('contactEmail')} />
          {errors.contactEmail && (
            <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo proveedor
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && suppliers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Sin proveedores. Creá el primero.
                </TableCell>
              </TableRow>
            )}
            {suppliers?.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.cuit ?? '—'}</TableCell>
                <TableCell>{s.contactName ?? '—'}</TableCell>
                <TableCell>{s.contactEmail ?? '—'}</TableCell>
                <TableCell>{s.contactPhone ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.isActive ? 'default' : 'secondary'}>
                    {s.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          </DialogHeader>
          <SupplierForm
            key={editing?.id ?? 'new'}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    cuit: editing.cuit ?? undefined,
                    address: editing.address ?? undefined,
                    contactName: editing.contactName ?? undefined,
                    contactEmail: editing.contactEmail ?? undefined,
                    contactPhone: editing.contactPhone ?? undefined,
                  }
                : undefined
            }
            supplierId={editing?.id}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
