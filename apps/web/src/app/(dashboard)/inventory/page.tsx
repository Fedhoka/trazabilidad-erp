'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useInventoryLots, useUpdateLotStatus, type InventoryLot } from '@/hooks/use-dashboard';
import { downloadReport } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Download, Layers } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  AVAILABLE: 'default',
  QUARANTINE: 'secondary',
  BLOCKED: 'destructive',
  EXPIRED: 'outline',
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponible',
  QUARANTINE: 'Cuarentena',
  BLOCKED: 'Bloqueado',
  EXPIRED: 'Vencido',
};

const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  QUARANTINE: [
    { label: 'Liberar → Disponible', next: 'AVAILABLE' },
    { label: 'Bloquear', next: 'BLOCKED' },
  ],
  BLOCKED: [
    { label: 'Liberar → Disponible', next: 'AVAILABLE' },
    { label: 'Poner en cuarentena', next: 'QUARANTINE' },
  ],
  AVAILABLE: [
    { label: 'Bloquear', next: 'BLOCKED' },
    { label: 'Poner en cuarentena', next: 'QUARANTINE' },
  ],
};

type FilterTab = 'ALL' | 'AVAILABLE' | 'QUARANTINE' | 'BLOCKED' | 'EXPIRED';

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'QUARANTINE', label: 'Cuarentena' },
  { value: 'BLOCKED', label: 'Bloqueado' },
  { value: 'EXPIRED', label: 'Vencido' },
];

function expiryClass(expiresOn: string | null): string {
  if (!expiresOn) return '';
  const days = Math.ceil((new Date(expiresOn).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'text-destructive font-medium';
  if (days <= 30) return 'text-orange-600 font-medium';
  return '';
}

function LotActions({ lot }: { lot: InventoryLot }) {
  const update = useUpdateLotStatus();
  const actions = STATUS_ACTIONS[lot.status] ?? [];
  if (!actions.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm" className="text-xs h-7" type="button">
          Acción
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map(({ label, next }) => (
          <DropdownMenuItem
            key={next}
            onClick={() =>
              update.mutate(
                { id: lot.id, status: next },
                {
                  onSuccess: () => toast.success(`Lote ${lot.lotCode} → ${STATUS_LABEL[next] ?? next}`),
                  onError: () => toast.error('No se pudo actualizar el estado'),
                },
              )
            }
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function InventoryPage() {
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);
  const includeExpired = tab === 'ALL' || tab === 'EXPIRED';
  const { data: lotsResult, isLoading } = useInventoryLots(includeExpired, page);

  const lots = lotsResult?.data
    ? tab === 'ALL'
      ? lotsResult.data
      : lotsResult.data.filter((l) => l.status === tab)
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventario"
        description="Lotes de materia prima y productos terminados disponibles."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => downloadReport('/reports/stock.csv', 'stock.csv')}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 border-b pb-0">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            {lotsResult?.meta && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                {value === 'ALL'
                  ? lotsResult.meta.total
                  : lotsResult.data.filter((l) => l.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      )}

      {!isLoading && lotsResult && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Código lote</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo unit.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={Layers}
                      title="Sin lotes en esta categoría"
                      description="Los lotes aparecen acá cuando recibís una orden de compra o completás una orden de producción."
                    />
                  </TableCell>
                </TableRow>
              )}
              {lots.map((lot: InventoryLot) => (
                <TableRow key={lot.id} className={lot.status === 'EXPIRED' ? 'opacity-50' : ''}>
                  <TableCell>
                    <p className="font-medium">{lot.materialName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{lot.materialCode}</p>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{lot.lotCode}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(lot.quantity).toLocaleString('es-AR', { maximumFractionDigits: 4 })}
                    {' '}
                    <span className="text-muted-foreground text-xs">{lot.baseUom}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(lot.unitCost).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[lot.status] ?? 'outline'}>
                      {STATUS_LABEL[lot.status] ?? lot.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={expiryClass(lot.expiresOn)}>
                    {lot.expiresOn
                      ? new Date(lot.expiresOn).toLocaleDateString('es-AR')
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lot.locationName
                      ? `${lot.locationName} (${lot.locationCode})`
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <LotActions lot={lot} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={lotsResult?.meta.totalPages ?? 1}
        total={lotsResult?.meta.total ?? 0}
        onPageChange={(p) => { setPage(p); }}
      />
    </div>
  );
}
