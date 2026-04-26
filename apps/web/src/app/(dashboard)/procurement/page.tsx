'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Eye, Download } from 'lucide-react';
import { downloadReport } from '@/lib/api';
import { usePurchaseOrders, useCreatePurchaseOrder } from '@/hooks/use-procurement';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  APPROVED: 'Aprobada',
  RECEIVED: 'Recibida',
  CLOSED: 'Cerrada',
  CANCELLED: 'Cancelada',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  APPROVED: 'default',
  RECEIVED: 'default',
  CLOSED: 'secondary',
  CANCELLED: 'destructive',
};

const lineSchema = z.object({
  materialId: z.string().uuid('Seleccioná un material'),
  quantity: z.string().min(1, 'Requerido'),
  unitPrice: z.string().min(1, 'Requerido'),
});

const schema = z.object({
  supplierId: z.string().uuid('Seleccioná un proveedor'),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, 'Al menos una línea'),
});

type FormValues = z.infer<typeof schema>;

function CreatePODialog({ onClose }: { onClose: () => void }) {
  const { data: suppliers } = useSuppliers();
  const { data: materials } = useMaterials();
  const create = useCreatePurchaseOrder();

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
  const supplierId = watch('supplierId');

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        supplierId: values.supplierId,
        notes: values.notes,
        lines: values.lines.map((l) => ({
          materialId: l.materialId,
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unitPrice),
        })),
      });
      toast.success('Orden de compra creada');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Proveedor *</Label>
        <Select value={supplierId} onValueChange={(v) => v && setValue('supplierId', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar…" />
          </SelectTrigger>
          <SelectContent>
            {suppliers?.filter((s) => s.isActive).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.supplierId && (
          <p className="text-xs text-destructive">{errors.supplierId.message}</p>
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
        {errors.lines?.root && (
          <p className="text-xs text-destructive">{errors.lines.root.message}</p>
        )}
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
                        {materials?.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.code} — {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      type="number"
                      step="0.0001"
                      min="0"
                      {...register(`lines.${i}.quantity`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`lines.${i}.unitPrice`)}
                    />
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
          {isSubmitting ? 'Creando…' : 'Crear OC'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ProcurementPage() {
  const router = useRouter();
  const { data: orders, isLoading } = usePurchaseOrders();
  const { data: suppliers } = useSuppliers();
  const [open, setOpen] = useState(false);

  const supplierMap = Object.fromEntries((suppliers ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Órdenes de compra</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => downloadReport('/reports/purchases.csv', 'compras.csv')}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nueva OC
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Proveedor</TableHead>
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
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && orders?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin órdenes de compra.
                </TableCell>
              </TableRow>
            )}
            {orders?.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-mono font-medium">{po.number}</TableCell>
                <TableCell>{supplierMap[po.supplierId] ?? po.supplierId}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[po.status]}>
                    {STATUS_LABELS[po.status] ?? po.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {po.notes ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(po.createdAt).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/procurement/${po.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva orden de compra</DialogTitle>
          </DialogHeader>
          <CreatePODialog onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
