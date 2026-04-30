'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Archive } from 'lucide-react';
import {
  useFixedCosts,
  useCreateFixedCost,
  useUpdateFixedCost,
  useArchiveFixedCost,
  type FixedCost,
} from '@/hooks/use-fixed-costs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { Calculator } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
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
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  category: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Requerido')
    .refine((v) => !Number.isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: 'Monto inválido',
    }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function FixedCostForm({
  defaultValues,
  cost,
  onClose,
}: {
  defaultValues?: Partial<FormValues>;
  cost?: FixedCost;
  onClose: () => void;
}) {
  const create = useCreateFixedCost();
  const update = useUpdateFixedCost(cost?.id ?? '');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      ...(values.category ? { category: values.category } : {}),
      amount: parseFloat(values.amount),
      ...(values.notes ? { notes: values.notes } : {}),
    };
    try {
      if (cost) {
        await update.mutateAsync(payload);
        toast.success('Costo actualizado');
      } else {
        await create.mutateAsync(payload);
        toast.success('Costo creado');
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
        <Input {...register('name')} placeholder="Alquiler, sueldos…" />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Input
            {...register('category')}
            placeholder="Operativo, RRHH, Servicios…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Monto mensual *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register('amount')}
            placeholder="0,00"
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Textarea rows={2} {...register('notes')} />
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

export default function FixedCostsPage() {
  const { data: costs, isLoading } = useFixedCosts();
  const archive = useArchiveFixedCost();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FixedCost | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(c: FixedCost) {
    setEditing(c);
    setOpen(true);
  }

  async function handleArchive(c: FixedCost) {
    if (!confirm(`¿Archivar "${c.name}"? No volverá a sumar al punto de equilibrio.`))
      return;
    try {
      await archive.mutateAsync(c.id);
      toast.success('Costo archivado');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  // Total of active monthly costs — surfaces above the table.
  const activeTotal = (costs ?? [])
    .filter((c) => c.isActive)
    .reduce((acc, c) => acc + Number(c.amount), 0);

  return (
    <>
      <PageHeader
        title="Costos fijos"
        description="Egresos mensuales que se usan para calcular el punto de equilibrio."
        actions={
          <Button onClick={openCreate} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo costo
          </Button>
        }
      />

      {/* Active total summary */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Costo fijo mensual activo
            </p>
            <p className="font-mono text-3xl font-semibold tracking-tight">
              {isLoading ? <Skeleton className="h-9 w-40" /> : formatCurrency(activeTotal)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {(costs ?? []).filter((c) => c.isActive).length} ítems activos
          </p>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Monto mensual</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {!isLoading && (costs ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <EmptyState
                  icon={Calculator}
                  title="Aún no cargaste costos fijos"
                  description="Cargá los gastos mensuales que tenés sí o sí (alquiler, sueldos, servicios). Sin esto, el punto de equilibrio no se puede calcular."
                  action={
                    <Button onClick={openCreate} className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Cargar costo fijo
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          )}
          {costs?.map((c) => (
            <TableRow key={c.id} className={c.isActive ? '' : 'opacity-60'}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                {c.category ? (
                  <Badge variant="outline">{c.category}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrency(Number(c.amount))}
              </TableCell>
              <TableCell>
                <Badge variant={c.isActive ? 'success' : 'secondary'}>
                  {c.isActive ? 'Activo' : 'Archivado'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {c.isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArchive(c)}
                      title="Archivar"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar costo fijo' : 'Nuevo costo fijo'}
            </DialogTitle>
          </DialogHeader>
          <FixedCostForm
            key={editing?.id ?? 'new'}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    category: editing.category ?? undefined,
                    amount: editing.amount,
                    notes: editing.notes ?? undefined,
                  }
                : undefined
            }
            cost={editing ?? undefined}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
