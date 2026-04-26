'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Pencil } from 'lucide-react';
import {
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  type Material,
  type MaterialKind,
} from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

const KIND_LABELS: Record<MaterialKind, string> = {
  RAW: 'Insumo',
  PACKAGING: 'Envase',
  WIP: 'Semi-elaborado',
  FINISHED: 'Producto terminado',
};

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  code: z.string().min(1, 'Requerido'),
  kind: z.enum(['RAW', 'PACKAGING', 'WIP', 'FINISHED']),
  baseUom: z.string().min(1, 'Requerido'),
  shelfLifeDays: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function MaterialForm({
  defaultValues,
  materialId,
  onClose,
}: {
  defaultValues?: Partial<FormValues>;
  materialId?: string;
  onClose: () => void;
}) {
  const create = useCreateMaterial();
  const update = useUpdateMaterial(materialId ?? '');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const kind = watch('kind');

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      code: values.code,
      kind: values.kind,
      baseUom: values.baseUom,
      ...(values.shelfLifeDays ? { shelfLifeDays: parseInt(values.shelfLifeDays, 10) } : {}),
    };
    try {
      if (materialId) {
        await update.mutateAsync(payload);
        toast.success('Material actualizado');
      } else {
        await create.mutateAsync(payload);
        toast.success('Material creado');
      }
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Nombre *</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Código *</Label>
          <Input {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo *</Label>
          <Select
            value={kind}
            onValueChange={(v) => setValue('kind', v as MaterialKind)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(KIND_LABELS) as MaterialKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.kind && <p className="text-xs text-destructive">{errors.kind.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Unidad de medida *</Label>
          <Input {...register('baseUom')} placeholder="kg, L, unid…" />
          {errors.baseUom && <p className="text-xs text-destructive">{errors.baseUom.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5 w-1/2">
        <Label>Vida útil (días)</Label>
        <Input type="number" min={1} {...register('shelfLifeDays')} />
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

export default function MaterialsPage() {
  const { data: materials, isLoading } = useMaterials();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(m: Material) {
    setEditing(m);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Materiales</h1>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo material
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead>Vida útil</TableHead>
              <TableHead className="text-right">Costo prom.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && materials?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Sin materiales. Creá el primero.
                </TableCell>
              </TableRow>
            )}
            {materials?.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-sm">{m.code}</TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{KIND_LABELS[m.kind]}</Badge>
                </TableCell>
                <TableCell>{m.baseUom}</TableCell>
                <TableCell>{m.shelfLifeDays ? `${m.shelfLifeDays}d` : '—'}</TableCell>
                <TableCell className="text-right font-mono">
                  {Number(m.avgCost).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={m.isActive ? 'default' : 'secondary'}>
                    {m.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
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
            <DialogTitle>{editing ? 'Editar material' : 'Nuevo material'}</DialogTitle>
          </DialogHeader>
          <MaterialForm
            key={editing?.id ?? 'new'}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    code: editing.code,
                    kind: editing.kind,
                    baseUom: editing.baseUom,
                    shelfLifeDays: editing.shelfLifeDays != null ? String(editing.shelfLifeDays) : undefined,
                  }
                : undefined
            }
            materialId={editing?.id}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
