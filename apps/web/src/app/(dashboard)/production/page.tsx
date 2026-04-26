'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Eye, Search, Download } from 'lucide-react';
import { downloadReport } from '@/lib/api';
import {
  useRecipes,
  useProductionOrders,
  useCreateRecipe,
  useActivateRecipe,
  useArchiveRecipe,
  useCreateProductionOrder,
} from '@/hooks/use-production';
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

type Tab = 'recipes' | 'orders';

const RECIPE_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> =
  { DRAFT: 'outline', ACTIVE: 'default', ARCHIVED: 'secondary' };

const PO_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  IN_PROGRESS: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

// ─── Create Recipe Dialog ──────────────────────────────────────────────────

const compSchema = z.object({
  materialId: z.string().uuid('Seleccioná un material'),
  qtyPerBatch: z.string().min(1, 'Requerido'),
  lossPct: z.string().optional(),
});

const recipeSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  outputMaterialId: z.string().uuid('Seleccioná el material de salida'),
  outputQty: z.string().min(1, 'Requerido'),
  batchSizeUom: z.string().min(1, 'Requerido'),
  notes: z.string().optional(),
  components: z.array(compSchema).min(1, 'Al menos un componente'),
});

type RecipeFormValues = z.infer<typeof recipeSchema>;

function CreateRecipeDialog({ onClose }: { onClose: () => void }) {
  const { data: materials } = useMaterials();
  const create = useCreateRecipe();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { components: [{ materialId: '', qtyPerBatch: '', lossPct: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'components' });
  const outputMaterialId = watch('outputMaterialId');

  async function onSubmit(values: RecipeFormValues) {
    try {
      await create.mutateAsync({
        name: values.name,
        outputMaterialId: values.outputMaterialId,
        outputQty: parseFloat(values.outputQty),
        batchSizeUom: values.batchSizeUom,
        notes: values.notes,
        components: values.components.map((c) => ({
          materialId: c.materialId,
          qtyPerBatch: parseFloat(c.qtyPerBatch),
          ...(c.lossPct ? { lossPct: parseFloat(c.lossPct) } : {}),
        })),
      });
      toast.success('Receta creada');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nombre *</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Material de salida *</Label>
          <Select
            value={outputMaterialId}
            onValueChange={(v) => v && setValue('outputMaterialId', v)}
          >
            <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
            <SelectContent>
              {materials?.filter((m) => m.kind === 'FINISHED' || m.kind === 'WIP').map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.outputMaterialId && (
            <p className="text-xs text-destructive">{errors.outputMaterialId.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Cantidad de salida *</Label>
          <Input type="number" step="0.0001" {...register('outputQty')} />
        </div>
        <div className="space-y-1.5">
          <Label>UoM del lote *</Label>
          <Input placeholder="kg, unid…" {...register('batchSizeUom')} />
        </div>
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Input {...register('notes')} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Componentes *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => append({ materialId: '', qtyPerBatch: '', lossPct: '' })}
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
                <TableHead className="w-28">Cant./lote</TableHead>
                <TableHead className="w-24">Merma %</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, i) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Select
                      value={watch(`components.${i}.materialId`)}
                      onValueChange={(v) => v && setValue(`components.${i}.materialId`, v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Material…" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" type="number" step="0.0001" {...register(`components.${i}.qtyPerBatch`)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" type="number" step="0.1" min="0" max="100" {...register(`components.${i}.lossPct`)} />
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
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando…' : 'Crear receta'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Create Production Order Dialog ───────────────────────────────────────

function CreatePODialog({ onClose }: { onClose: () => void }) {
  const { data: recipes } = useRecipes();
  const create = useCreateProductionOrder();
  const [recipeId, setRecipeId] = useState('');
  const [plannedQty, setPlannedQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!recipeId || !plannedQty) { toast.error('Completá los campos requeridos'); return; }
    setSaving(true);
    try {
      await create.mutateAsync({ recipeId, plannedQty: parseFloat(plannedQty), notes: notes || undefined });
      toast.success('Orden de producción creada');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Receta *</Label>
        <Select value={recipeId} onValueChange={(v) => v && setRecipeId(v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
          <SelectContent>
            {recipes?.filter((r) => r.status === 'ACTIVE').map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Cantidad planificada *</Label>
        <Input type="number" step="0.0001" value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? 'Creando…' : 'Crear orden'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ProductionPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('recipes');
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const { data: recipes, isLoading: recLoading } = useRecipes();
  const { data: orders, isLoading: poLoading } = useProductionOrders();
  const { data: materials } = useMaterials();

  const materialMap = Object.fromEntries((materials ?? []).map((m) => [m.id, m.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Producción</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => router.push('/production/traceability')}
        >
          <Search className="h-4 w-4" />
          Trazabilidad
        </Button>
        <Button variant="outline" size="sm" className="gap-2"
          onClick={() => downloadReport('/reports/production-costs.csv', 'costos-produccion.csv')}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['recipes', 'orders'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'recipes' ? 'Recetas' : 'Órdenes'}
          </button>
        ))}
      </div>

      {/* Recipes tab */}
      {tab === 'recipes' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-2" onClick={() => setRecipeOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Nueva receta
            </Button>
          </div>
          <RecipeTable
            recipes={recipes}
            isLoading={recLoading}
            materialMap={materialMap}
          />
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-2" onClick={() => setPoOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Nueva orden
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Cant. plan.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {poLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!poLoading && orders?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Sin órdenes de producción.
                    </TableCell>
                  </TableRow>
                )}
                {orders?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.number}</TableCell>
                    <TableCell>{materialMap[o.outputMaterialId] ?? o.outputMaterialId}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(o.plannedQty).toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PO_STATUS_VARIANT[o.status]}>
                        {PO_STATUS_LABELS[o.status] ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/production/orders/${o.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva receta</DialogTitle></DialogHeader>
          <CreateRecipeDialog onClose={() => setRecipeOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={poOpen} onOpenChange={setPoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nueva orden de producción</DialogTitle></DialogHeader>
          <CreatePODialog onClose={() => setPoOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecipeTable({
  recipes,
  isLoading,
  materialMap,
}: {
  recipes?: ReturnType<typeof useRecipes>['data'];
  isLoading: boolean;
  materialMap: Record<string, string>;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Material salida</TableHead>
            <TableHead className="text-right">Cant. lote</TableHead>
            <TableHead>UoM</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ver.</TableHead>
            <TableHead className="w-20">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          {!isLoading && recipes?.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Sin recetas. Creá la primera.
              </TableCell>
            </TableRow>
          )}
          {recipes?.map((r) => (
            <RecipeRow key={r.id} recipe={r} materialMap={materialMap} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RecipeRow({
  recipe,
  materialMap,
}: {
  recipe: NonNullable<ReturnType<typeof useRecipes>['data']>[number];
  materialMap: Record<string, string>;
}) {
  const activate = useActivateRecipe(recipe.id);
  const archive = useArchiveRecipe(recipe.id);

  return (
    <TableRow>
      <TableCell className="font-medium">{recipe.name}</TableCell>
      <TableCell>{materialMap[recipe.outputMaterialId] ?? recipe.outputMaterialId}</TableCell>
      <TableCell className="text-right font-mono">{Number(recipe.outputQty).toLocaleString('es-AR')}</TableCell>
      <TableCell>{recipe.batchSizeUom}</TableCell>
      <TableCell>
        <Badge variant={RECIPE_STATUS_VARIANT[recipe.status]}>{recipe.status}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">v{recipe.version}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          {recipe.status === 'DRAFT' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={activate.isPending}
              onClick={async () => {
                try { await activate.mutateAsync(); toast.success('Receta activada'); }
                catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
              }}
            >
              Activar
            </Button>
          )}
          {recipe.status === 'ACTIVE' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              disabled={archive.isPending}
              onClick={async () => {
                try { await archive.mutateAsync(); toast.success('Receta archivada'); }
                catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
              }}
            >
              Archivar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
