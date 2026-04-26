'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, FileDown, Download } from 'lucide-react';
import { apiFetchBlob, downloadReport } from '@/lib/api';
import { usePointsOfSale, useCreatePointOfSale, useInvoices } from '@/hooks/use-fiscal';
import { useCustomers } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Separator } from '@/components/ui/separator';
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

const posSchema = z.object({
  number: z.string().min(1, 'Requerido'),
  name: z.string().min(1, 'Requerido'),
});

type PosFormValues = z.infer<typeof posSchema>;

function CreatePOSDialog({ onClose }: { onClose: () => void }) {
  const create = useCreatePointOfSale();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PosFormValues>({ resolver: zodResolver(posSchema) });

  async function onSubmit(values: PosFormValues) {
    try {
      await create.mutateAsync({ number: parseInt(values.number, 10), name: values.name });
      toast.success('Punto de venta creado');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Número *</Label>
          <Input type="number" min={1} max={999} {...register('number')} />
          {errors.number && <p className="text-xs text-destructive">{errors.number.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Nombre *</Label>
          <Input {...register('name')} placeholder="Ej: Casa Central" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando…' : 'Crear'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function FiscalPage() {
  const [invPage, setInvPage] = useState(1);
  const [posOpen, setPosOpen] = useState(false);
  const { data: posList, isLoading: posLoading } = usePointsOfSale();
  const { data: invResult, isLoading: invLoading } = useInvoices(invPage);
  const { data: customersResult } = useCustomers();

  const customerMap = Object.fromEntries((customersResult?.data ?? []).map((c) => [c.id, c.name]));

  async function downloadPdf(invoiceId: string, invoiceNumber: number) {
    try {
      const blob = await apiFetchBlob(`/invoices/${invoiceId}/pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${String(invoiceNumber).padStart(8, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el PDF');
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Fiscal</h1>

      {/* Points of Sale */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Puntos de venta</h2>
          <Button onClick={() => setPosOpen(true)} size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo POS
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posLoading &&
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              {!posLoading && posList?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Sin puntos de venta. Creá el primero.
                  </TableCell>
                </TableRow>
              )}
              {posList?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono font-medium">
                    {String(p.number).padStart(4, '0')}
                  </TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Separator />

      {/* Invoices */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Facturas emitidas</h2>
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => downloadReport('/reports/invoices.csv', 'facturas.csv')}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>CAE</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              {!invLoading && invResult?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Sin facturas emitidas.
                  </TableCell>
                </TableRow>
              )}
              {invResult?.data.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Badge variant="outline">Fac. {inv.invoiceType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                  <TableCell>{customerMap[inv.customerId] ?? inv.customerId}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(inv.netAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(inv.ivaAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {Number(inv.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{inv.cae ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'AUTHORIZED' ? 'default' : 'destructive'}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('es-AR') : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadPdf(inv.id, Number(inv.invoiceNumber))}
                      title="Descargar PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <PaginationControls
          page={invPage}
          totalPages={invResult?.meta.totalPages ?? 1}
          total={invResult?.meta.total ?? 0}
          onPageChange={setInvPage}
        />
      </section>

      <Dialog open={posOpen} onOpenChange={setPosOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo punto de venta</DialogTitle>
          </DialogHeader>
          <CreatePOSDialog onClose={() => setPosOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
