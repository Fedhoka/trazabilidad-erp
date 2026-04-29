'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateMaterial,
  type Material,
  type MaterialKind,
} from '@/hooks/use-materials';

const KIND_LABEL: Record<MaterialKind, string> = {
  RAW: 'Materia prima',
  PACKAGING: 'Packaging',
  WIP: 'En proceso',
  FINISHED: 'Producto terminado',
};

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  code: z
    .string()
    .min(1, 'Requerido')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[A-Z0-9._\-]+$/i, 'Sólo letras, números, "-", "_", "."'),
  kind: z.enum(['RAW', 'PACKAGING', 'WIP', 'FINISHED']),
  baseUom: z.string().min(1, 'Requerido'),
  shelfLifeDays: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Días debe ser un número entero'),
});

type FormValues = z.infer<typeof schema>;

interface QuickCreateInsumoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created material on success — useful to auto-select it. */
  onCreated?: (material: Material) => void;
  /** Default kind in the form — usually RAW for procurement context. */
  defaultKind?: MaterialKind;
  /** Title override (defaults to "Nuevo insumo"). */
  title?: string;
}

/**
 * Compact dialog to create a new material on-the-fly without leaving the
 * current screen. After successful creation, the parent gets the new
 * material via `onCreated` so it can be selected in a dropdown.
 */
export function QuickCreateInsumo({
  open,
  onOpenChange,
  onCreated,
  defaultKind = 'RAW',
  title = 'Nuevo insumo',
}: QuickCreateInsumoProps) {
  const create = useCreateMaterial();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kind: defaultKind, baseUom: 'kg' },
  });

  const kind = watch('kind');

  async function onSubmit(values: FormValues) {
    try {
      const created = await create.mutateAsync({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        kind: values.kind,
        baseUom: values.baseUom.trim(),
        ...(values.shelfLifeDays
          ? { shelfLifeDays: parseInt(values.shelfLifeDays, 10) }
          : {}),
      });
      toast.success('Insumo creado');
      onCreated?.(created);
      reset({ kind: defaultKind, baseUom: 'kg' });
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al crear insumo');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Lo agregás al catálogo y queda listo para usar en la orden.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="qc-name">Nombre *</Label>
            <Input
              id="qc-name"
              placeholder="Harina 0000"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qc-code">Código *</Label>
              <Input
                id="qc-code"
                placeholder="HAR-0000"
                className="uppercase"
                {...register('code')}
              />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qc-uom">Unidad *</Label>
              <Input id="qc-uom" placeholder="kg / lt / un" {...register('baseUom')} />
              {errors.baseUom && (
                <p className="text-xs text-destructive">{errors.baseUom.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select
                value={kind}
                onValueChange={(v) => v && setValue('kind', v as MaterialKind)}
              >
                <SelectTrigger>
                  <SelectValue
                    getLabel={(v) => KIND_LABEL[v as MaterialKind]}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as MaterialKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qc-shelf">Vida útil (días)</Label>
              <Input
                id="qc-shelf"
                type="number"
                min="0"
                placeholder="opcional"
                {...register('shelfLifeDays')}
              />
              {errors.shelfLifeDays && (
                <p className="text-xs text-destructive">
                  {errors.shelfLifeDays.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando…' : 'Crear insumo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
