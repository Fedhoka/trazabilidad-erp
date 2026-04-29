'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Eye, Download, Sparkles } from 'lucide-react';
import { downloadReport } from '@/lib/api';
import { usePurchaseOrders, useCreatePurchaseOrder } from '@/hooks/use-procurement';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useMaterials, type Material } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { QuickCreateInsumo } from '@/components/forms/quick-create-insumo';
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
  materialId: z.string().uuid('Seleccioná un insumo'),
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
  const { data: suppliersResult } = useSuppliers();
  const { data: materialsResult } = useMaterials();
  const create = useCreatePurchaseOrder();

  const [insumoOpen, setInsumoOpen] = useState(false);

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

  /**
   * After creating an insumo, drop it into the first empty line if there is
   * one, otherwise append a new line with it pre-selected.
   */
  function handleInsumoCreated(material: Material) {
    const currentLines = watch('lines');
    const emptyIndex = currentLines.findIndex((l) => !l.materialId);
    if (emptyIndex >= 0) {
      setValue(`lines.${emptyIndex}.materialId`, material.id, {
        shouldValidate: true,
      });
    } else {
      append({ materialId: material.id, quantity: '', unitPrice: '' });
    }
  }

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
            {suppliersResult?.data.filter((s) => s.isActive).map((s) => (
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
        <div className="flex items-center justify-between gap-2">
          <Label>Líneas *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setInsumoOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Nuevo insumo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => append({ materialId: '', quantity: '', unitPrice: '' })}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Agregar línea
            </Button>
          </div>
        </div>
        {errors.lines?.root && (
          <p className="text-xs text-destructive">{errors.lines.root.message}</p>
        )}

        {materialsResult && materialsResult.data.length === 0 && (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Todavía no hay insumos cargados.{' '}
            <button
              type="button"
              onClick={() => setInsumoOpen(true)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Creá el primero
            </button>{' '}
            para poder armar la orden.
          </div>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
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
                        <SelectValue placeholder="Insumo…" />
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

      {/* Nested dialog: quick-create an insumo without leaving the OC form */}
      <QuickCreateInsumo
        open={insumoOpen}
        onOpenChange={setInsumoOpen}
        onCreated={handleInsumoCreated}
      />
    </form>
  );
}

export default function ProcurementPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { data: result, isLoading } = usePurchaseOrders(page);
  const { data: suppliersResult } = useSuppliers();

  const supplierMap = Object.fromEntries((suppliersResult?.data ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Órdenes de compra"
        description="Solicitudes a proveedores y su estado de recepción."
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => downloadReport('/reports/purchases.csv', 'compras.csv')}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nueva OC
            </Button>
          </>
        }
      />

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
            {!isLoading && result?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin órdenes de compra.
                </TableCell>
              </TableRow>
            )}
            {result?.data.map((po) => (
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

      <PaginationControls
        page={page}
        totalPages={result?.meta.totalPages ?? 1}
        total={result?.meta.total ?? 0}
        onPageChange={setPage}
      />

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
