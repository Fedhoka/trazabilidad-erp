'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  useProductionOrder,
  useStartPO,
  useRecordConsumption,
  useCompletePO,
  useCancelPO,
} from '@/hooks/use-production';
import { useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  IN_PROGRESS: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

export default function ProductionOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: po, isLoading } = useProductionOrder(id);
  const { data: materials } = useMaterials();
  const start = useStartPO(id);
  const consume = useRecordConsumption(id);
  const complete = useCompletePO(id);
  const cancel = useCancelPO(id);

  const materialMap = Object.fromEntries((materials ?? []).map((m) => [m.id, m.name]));

  // Consume form state
  const [lotId, setLotId] = useState('');
  const [consumeQty, setConsumeQty] = useState('');

  // Complete form state
  const [actualQty, setActualQty] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [expiresOn, setExpiresOn] = useState('');

  async function handleConsume() {
    if (!lotId || !consumeQty) { toast.error('Completá lote y cantidad'); return; }
    try {
      await consume.mutateAsync({ materialLotId: lotId, quantity: parseFloat(consumeQty) });
      toast.success('Consumo registrado');
      setLotId(''); setConsumeQty('');
    } catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
  }

  async function handleComplete() {
    if (!actualQty || !lotCode) { toast.error('Completá cantidad real y código de lote'); return; }
    try {
      await complete.mutateAsync({
        actualQty: parseFloat(actualQty),
        lotCode,
        ...(expiresOn ? { expiresOn } : {}),
      });
      toast.success('Orden completada');
    } catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!po) return <p className="text-muted-foreground">Orden no encontrada.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/production')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">OP #{po.number}</h1>
        <Badge variant={STATUS_VARIANT[po.status]}>{po.status}</Badge>
      </div>

      {/* Header info */}
      <div className="grid gap-4 sm:grid-cols-4 text-sm">
        <div>
          <p className="text-muted-foreground">Material</p>
          <p className="font-medium">{materialMap[po.outputMaterialId] ?? po.outputMaterialId}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Cant. planificada</p>
          <p className="font-medium font-mono">{Number(po.plannedQty).toLocaleString('es-AR')}</p>
        </div>
        {po.theoreticalCost != null && (
          <div>
            <p className="text-muted-foreground">Costo teórico</p>
            <p className="font-medium font-mono">{Number(po.theoreticalCost).toFixed(2)}</p>
          </div>
        )}
        {po.actualQty != null && (
          <div>
            <p className="text-muted-foreground">Cant. real</p>
            <p className="font-medium font-mono">{Number(po.actualQty).toLocaleString('es-AR')}</p>
          </div>
        )}
        {po.actualCost != null && (
          <div>
            <p className="text-muted-foreground">Costo real</p>
            <p className="font-medium font-mono">{Number(po.actualCost).toFixed(2)}</p>
          </div>
        )}
        {po.notes && (
          <div className="col-span-4">
            <p className="text-muted-foreground">Notas</p>
            <p>{po.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {po.status === 'DRAFT' && (
          <>
            <Button
              disabled={start.isPending}
              onClick={async () => {
                try { await start.mutateAsync(); toast.success('Orden iniciada'); }
                catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
              }}
            >
              Iniciar producción
            </Button>
            <Button
              variant="destructive"
              disabled={cancel.isPending}
              onClick={async () => {
                try { await cancel.mutateAsync(); toast.success('Orden cancelada'); }
                catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
              }}
            >
              Cancelar
            </Button>
          </>
        )}
      </div>

      {/* In-progress actions */}
      {po.status === 'IN_PROGRESS' && (
        <>
          <Separator />

          {/* Record consumption */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Registrar consumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>ID del lote de material</Label>
                  <Input
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    placeholder="UUID del lote…"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={consumeQty}
                    onChange={(e) => setConsumeQty(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleConsume} disabled={consume.isPending} size="sm">
                {consume.isPending ? 'Registrando…' : 'Registrar consumo'}
              </Button>
            </CardContent>
          </Card>

          {/* Complete order */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Completar orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Cantidad real *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Código de lote *</Label>
                  <Input value={lotCode} onChange={(e) => setLotCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vencimiento</Label>
                  <Input
                    type="date"
                    value={expiresOn}
                    onChange={(e) => setExpiresOn(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleComplete} disabled={complete.isPending}>
                {complete.isPending ? 'Completando…' : 'Completar orden'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
