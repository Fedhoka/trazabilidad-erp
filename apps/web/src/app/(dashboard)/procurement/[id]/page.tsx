'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import {
  usePurchaseOrder,
  useApprovePO,
  useCancelPO,
  useCreateGoodsReceipt,
  type QcStatus,
} from '@/hooks/use-procurement';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const QC_LABELS: Record<QcStatus, string> = {
  PASS: 'Aprobado',
  FAIL: 'Rechazado',
  PENDING: 'Pendiente',
};

interface ReceiptLineState {
  purchaseOrderLineId: string;
  quantity: string;
  unitCost: string;
  lotCode: string;
  expiresOn: string;
  qcStatus: QcStatus;
  qcNotes: string;
}

export default function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: po, isLoading } = usePurchaseOrder(id);
  const { data: suppliersResult } = useSuppliers();
  const { data: materialsResult } = useMaterials();
  const approve = useApprovePO(id);
  const cancel = useCancelPO(id);
  const createReceipt = useCreateGoodsReceipt();
  const [showReceiptForm, setShowReceiptForm] = useState(false);

  const supplierMap = Object.fromEntries((suppliersResult?.data ?? []).map((s) => [s.id, s.name]));
  const materialMap = Object.fromEntries(
    (materialsResult?.data ?? []).map((m) => [m.id, `${m.code} — ${m.name}`]),
  );

  const [receiptLines, setReceiptLines] = useState<ReceiptLineState[]>([]);

  function initReceiptLines() {
    if (!po) return;
    setReceiptLines(
      po.lines.map((l) => ({
        purchaseOrderLineId: l.id,
        quantity: String(l.quantity),
        unitCost: String(l.unitPrice),
        lotCode: '',
        expiresOn: '',
        qcStatus: 'PASS' as QcStatus,
        qcNotes: '',
      })),
    );
    setShowReceiptForm(true);
  }

  function updateLine(idx: number, field: keyof ReceiptLineState, value: string) {
    setReceiptLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  async function submitReceipt() {
    if (!po) return;
    try {
      await createReceipt.mutateAsync({
        purchaseOrderId: po.id,
        lines: receiptLines.map((l) => ({
          purchaseOrderLineId: l.purchaseOrderLineId,
          quantity: parseFloat(l.quantity),
          unitCost: parseFloat(l.unitCost),
          lotCode: l.lotCode,
          ...(l.expiresOn ? { expiresOn: l.expiresOn } : {}),
          qcStatus: l.qcStatus,
          ...(l.qcNotes ? { qcNotes: l.qcNotes } : {}),
        })),
      });
      toast.success('Recepción registrada');
      setShowReceiptForm(false);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!po) return <p className="text-muted-foreground">OC no encontrada.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/procurement')}
          aria-label="Volver a Compras"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-heading text-[1.875rem] font-medium leading-tight tracking-tight text-foreground">
          OC #{po.number}
        </h1>
        <Badge
          variant={
            po.status === 'APPROVED'
              ? 'default'
              : po.status === 'CANCELLED'
                ? 'destructive'
                : po.status === 'DRAFT'
                  ? 'outline'
                  : 'secondary'
          }
        >
          {po.status}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <p className="text-muted-foreground">Proveedor</p>
          <p className="font-medium">{supplierMap[po.supplierId] ?? po.supplierId}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fecha</p>
          <p className="font-medium">{new Date(po.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
        {po.notes && (
          <div>
            <p className="text-muted-foreground">Notas</p>
            <p>{po.notes}</p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">Líneas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio unit.</TableHead>
                <TableHead className="text-right">Recibido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{materialMap[l.materialId] ?? l.materialId}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(l.quantity).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(l.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(l.receivedQty).toLocaleString('es-AR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {po.status === 'DRAFT' && (
          <>
            <Button
              onClick={async () => {
                try {
                  await approve.mutateAsync();
                  toast.success('OC aprobada');
                } catch (err: unknown) {
                  toast.error((err as Error).message ?? 'Error');
                }
              }}
              disabled={approve.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Aprobar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await cancel.mutateAsync();
                  toast.success('OC cancelada');
                } catch (err: unknown) {
                  toast.error((err as Error).message ?? 'Error');
                }
              }}
              disabled={cancel.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Cancelar
            </Button>
          </>
        )}
        {po.status === 'APPROVED' && !showReceiptForm && (
          <Button onClick={initReceiptLines} className="gap-2">
            Registrar recepción
          </Button>
        )}
      </div>

      {/* Receipt form */}
      {showReceiptForm && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="font-semibold">Registrar recepción</h2>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead className="w-24">Cantidad</TableHead>
                    <TableHead className="w-24">Costo unit.</TableHead>
                    <TableHead className="w-32">Lote</TableHead>
                    <TableHead className="w-36">Vencimiento</TableHead>
                    <TableHead className="w-32">QC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiptLines.map((rl, i) => {
                    const poLine = po.lines[i];
                    return (
                      <TableRow key={rl.purchaseOrderLineId}>
                        <TableCell className="text-sm">
                          {materialMap[poLine.materialId] ?? poLine.materialId}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            type="number"
                            step="0.0001"
                            value={rl.quantity}
                            onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            type="number"
                            step="0.01"
                            value={rl.unitCost}
                            onChange={(e) => updateLine(i, 'unitCost', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={rl.lotCode}
                            onChange={(e) => updateLine(i, 'lotCode', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            type="date"
                            value={rl.expiresOn}
                            onChange={(e) => updateLine(i, 'expiresOn', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={rl.qcStatus}
                            onValueChange={(v) => v && updateLine(i, 'qcStatus', v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue
                                getLabel={(v) => QC_LABELS[v as QcStatus]}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(QC_LABELS) as QcStatus[]).map((k) => (
                                <SelectItem key={k} value={k}>
                                  {QC_LABELS[k]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button onClick={submitReceipt} disabled={createReceipt.isPending}>
                {createReceipt.isPending ? 'Guardando…' : 'Confirmar recepción'}
              </Button>
              <Button variant="outline" onClick={() => setShowReceiptForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
