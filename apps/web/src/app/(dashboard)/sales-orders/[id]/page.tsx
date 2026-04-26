'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Receipt } from 'lucide-react';
import { useSalesOrder, useConfirmSO, useCancelSO } from '@/hooks/use-sales';
import { useCustomers } from '@/hooks/use-customers';
import { useMaterials } from '@/hooks/use-materials';
import { usePointsOfSale, useIssueInvoice, type IssueInvoiceLine } from '@/hooks/use-fiscal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

const IVA_RATES = [0, 10.5, 21] as const;

interface InvoiceLineState {
  description: string;
  quantity: string;
  unitPrice: string;
  ivaRate: string;
}

function IssueInvoiceDialog({
  soId,
  customerId,
  initialLines,
  onClose,
}: {
  soId: string;
  customerId: string;
  initialLines: InvoiceLineState[];
  onClose: () => void;
}) {
  const { data: posList } = usePointsOfSale();
  const issue = useIssueInvoice();
  const [posNumber, setPosNumber] = useState('');
  const [lines, setLines] = useState<InvoiceLineState[]>(initialLines);

  function updateLine(i: number, field: keyof InvoiceLineState, value: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  async function handleIssue() {
    const pos = posList?.find((p) => String(p.number) === posNumber);
    if (!pos) { toast.error('Seleccioná un punto de venta'); return; }
    if (lines.some((l) => !l.description || !l.quantity || !l.unitPrice)) {
      toast.error('Completá todos los campos de línea');
      return;
    }
    try {
      await issue.mutateAsync({
        pointOfSaleNumber: pos.number,
        customerId,
        salesOrderId: soId,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unitPrice),
          ivaRate: parseFloat(l.ivaRate) as IssueInvoiceLine['ivaRate'],
        })),
      });
      toast.success('Factura emitida');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Punto de venta *</Label>
        <Select value={posNumber} onValueChange={(v) => v && setPosNumber(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar…" />
          </SelectTrigger>
          <SelectContent>
            {posList?.filter((p) => p.isActive).map((p) => (
              <SelectItem key={p.id} value={String(p.number)}>
                {String(p.number).padStart(4, '0')} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-24">Cant.</TableHead>
              <TableHead className="w-24">P. unit.</TableHead>
              <TableHead className="w-28">IVA %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Input
                    className="h-8"
                    value={l.description}
                    onChange={(e) => updateLine(i, 'description', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8"
                    type="number"
                    step="0.0001"
                    value={l.quantity}
                    onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8"
                    type="number"
                    step="0.01"
                    value={l.unitPrice}
                    onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={l.ivaRate}
                    onValueChange={(v) => v && updateLine(i, 'ivaRate', v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IVA_RATES.map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {r}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleIssue} disabled={issue.isPending}>
          {issue.isPending ? 'Emitiendo…' : 'Emitir factura'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function SODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: so, isLoading } = useSalesOrder(id);
  const { data: customersResult } = useCustomers();
  const { data: materialsResult } = useMaterials();
  const confirm = useConfirmSO(id);
  const cancel = useCancelSO(id);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const customerMap = Object.fromEntries((customersResult?.data ?? []).map((c) => [c.id, c]));
  const materialMap = Object.fromEntries((materialsResult?.data ?? []).map((m) => [m.id, m]));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!so) return <p className="text-muted-foreground">Pedido no encontrado.</p>;

  const customer = customerMap[so.customerId];
  const invoiceLines: InvoiceLineState[] = so.lines.map((l) => ({
    description: materialMap[l.materialId]?.name ?? l.materialId,
    quantity: String(l.quantity),
    unitPrice: String(l.unitPrice),
    ivaRate: '21',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/sales-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Pedido #{so.number}</h1>
        <Badge
          variant={
            so.status === 'CONFIRMED' || so.status === 'SHIPPED'
              ? 'default'
              : so.status === 'CANCELLED'
                ? 'destructive'
                : so.status === 'INVOICED'
                  ? 'secondary'
                  : 'outline'
          }
        >
          {so.status}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <p className="text-muted-foreground">Cliente</p>
          <p className="font-medium">{customer?.name ?? so.customerId}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Condición IVA</p>
          <p className="font-medium">{customer?.condicionIva ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fecha</p>
          <p className="font-medium">{new Date(so.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
        {so.notes && (
          <div className="col-span-3">
            <p className="text-muted-foreground">Notas</p>
            <p>{so.notes}</p>
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
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {so.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{materialMap[l.materialId]?.name ?? l.materialId}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(l.quantity).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(l.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(Number(l.quantity) * Number(l.unitPrice)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {so.status === 'DRAFT' && (
          <>
            <Button
              className="gap-2"
              disabled={confirm.isPending}
              onClick={async () => {
                try { await confirm.mutateAsync(); toast.success('Pedido confirmado'); }
                catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
              }}
            >
              <CheckCircle className="h-4 w-4" />
              Confirmar
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={cancel.isPending}
              onClick={async () => {
                try { await cancel.mutateAsync(); toast.success('Pedido cancelado'); }
                catch (err: unknown) { toast.error((err as Error).message ?? 'Error'); }
              }}
            >
              <XCircle className="h-4 w-4" />
              Cancelar
            </Button>
          </>
        )}
        {so.status === 'CONFIRMED' && (
          <Button className="gap-2" onClick={() => setInvoiceOpen(true)}>
            <Receipt className="h-4 w-4" />
            Emitir factura
          </Button>
        )}
      </div>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emitir factura — Pedido #{so.number}</DialogTitle>
          </DialogHeader>
          <IssueInvoiceDialog
            soId={so.id}
            customerId={so.customerId}
            initialLines={invoiceLines}
            onClose={() => setInvoiceOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
