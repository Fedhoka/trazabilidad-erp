'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Eye } from 'lucide-react';
import { useSalesOrders, useCreateSalesOrder } from '@/hooks/use-sales';
import { useCustomers } from '@/hooks/use-customers';
import { useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Textarea } from '@/components/ui/textarea';
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

const SO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Despachado',
  INVOICED: 'Facturado',
  CANCELLED: 'Cancelado',
};

const SO_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  CONFIRMED: 'default',
  SHIPPED: 'default',
  INVOICED: 'secondary',
  CANCELLED: 'destructive',
};

const lineSchema = z.object({
  materialId: z.string().uuid('Seleccioná un material'),
  quantity: z.string().min(1, 'Requerido'),
  unitPrice: z.string().min(1, 'Requerido'),
});

const schema = z.object({
  customerId: z.string().uuid('Seleccioná un cliente'),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, 'Al menos una línea'),
});

type FormValues = z.infer<typeof schema>;

function CreateSODialog({ onClose }: { onClose: () => void }) {
  const { data: customersResult } = useCustomers();
  const { data: materialsResult } = useMaterials();
  const create = useCreateSalesOrder();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { lines: [{ materialId: '', quantity: '', unitPrice: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const customerId = watch('customerId');

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        customerId: values.customerId,
        notes: values.notes,
        lines: values.lines.map((l) => ({
          materialId: l.materialId,
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unitPrice),
        })),
      });
      toast.success('Pedido de venta creado');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Cliente *</Label>
        <Select value={customerId} onValueChange={(v) => v && setValue('customerId', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar…" />
          </SelectTrigger>
          <SelectContent>
            {customersResult?.data.filter((c) => c.isActive).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customerId && (
          <p className="text-xs text-destructive">{errors.customerId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Textarea rows={2} {...register('notes')} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Líneas *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => append({ materialId: '', quantity: '', unitPrice: '' })}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Agregar
          </Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="w-28">Cantidad</TableHead>
                <TableHead className="w-28">Precio unit.</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, i) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Select
                      value={watch(`lines.${i}.materialId`)}
                      onValueChange={(v) => v && setValue(`lines.${i}.materialId`, v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Material…" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialsResult?.data.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.code} — {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" type="number" step="0.0001" min="0" {...register(`lines.${i}.quantity`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" type="number" step="0.01" min="0" {...register(`lines.${i}.unitPrice`)} />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={fields.length === 1}
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando…' : 'Crear pedido'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function SalesOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { data: result, isLoading } = useSalesOrders(page);
  const { data: customersResult } = useCustomers();

  const customerMap = Object.fromEntries((customersResult?.data ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos de venta</h1>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo pedido
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead>Fecha</TableHead>
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
                  Sin pedidos de venta.
                </TableCell>
              </TableRow>
            )}
            {result?.data.map((so) => (
              <TableRow key={so.id}>
                <TableCell className="font-mono font-medium">{so.number}</TableCell>
                <TableCell>{customerMap[so.customerId] ?? so.customerId}</TableCell>
                <TableCell>
                  <Badge variant={SO_STATUS_VARIANT[so.status]}>
                    {SO_STATUS_LABELS[so.status] ?? so.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {so.notes ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(so.createdAt).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/sales-orders/${so.id}`)}>
                    <Eye className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo pedido de venta</DialogTitle>
          </DialogHeader>
          <CreateSODialog onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
