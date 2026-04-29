'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Pencil } from 'lucide-react';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  CONDICION_IVA_LABELS,
  type Customer,
  type CondicionIva,
} from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  condicionIva: z.enum(['RI', 'CF', 'MONO', 'EXENTO']),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function CustomerForm({
  defaultValues,
  customerId,
  onClose,
}: {
  defaultValues?: Partial<FormValues>;
  customerId?: string;
  onClose: () => void;
}) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer(customerId ?? '');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const condicionIva = watch('condicionIva');

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      condicionIva: values.condicionIva,
      ...(values.cuit ? { cuit: values.cuit } : {}),
      ...(values.address ? { address: values.address } : {}),
      ...(values.contactName ? { contactName: values.contactName } : {}),
      ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
      ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
    };
    try {
      if (customerId) {
        await update.mutateAsync(payload);
        toast.success('Cliente actualizado');
      } else {
        await create.mutateAsync(payload);
        toast.success('Cliente creado');
      }
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nombre *</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>CUIT</Label>
          <Input {...register('cuit')} placeholder="20-12345678-9" />
        </div>
        <div className="space-y-1.5">
          <Label>Condición IVA *</Label>
          <Select
            value={condicionIva}
            onValueChange={(v) => v && setValue('condicionIva', v as CondicionIva)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CONDICION_IVA_LABELS) as CondicionIva[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {CONDICION_IVA_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.condicionIva && (
            <p className="text-xs text-destructive">{errors.condicionIva.message}</p>
          )}
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
          <Label>Teléfono</Label>
          <Input {...register('contactPhone')} />
        </div>
        <div className="space-y-1.5 col-span-2">
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

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const { data: result, isLoading } = useCustomers(page);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description="Cartera de clientes y su condición frente al IVA."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Condición IVA</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && result?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin clientes. Creá el primero.
                </TableCell>
              </TableRow>
            )}
            {result?.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.cuit ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{CONDICION_IVA_LABELS[c.condicionIva]}</Badge>
                </TableCell>
                <TableCell>{c.contactName ?? c.contactEmail ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            key={editing?.id ?? 'new'}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    cuit: editing.cuit ?? undefined,
                    condicionIva: editing.condicionIva,
                    address: editing.address ?? undefined,
                    contactName: editing.contactName ?? undefined,
                    contactEmail: editing.contactEmail ?? undefined,
                    contactPhone: editing.contactPhone ?? undefined,
                  }
                : undefined
            }
            customerId={editing?.id}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
