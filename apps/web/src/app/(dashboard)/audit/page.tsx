'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuditLogs, type AuditAction } from '@/hooks/use-audit';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { PageHeader } from '@/components/layout/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ACTION_VARIANT: Record<AuditAction, 'default' | 'secondary' | 'destructive'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
};

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Eliminación',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const { data: result, isLoading } = useAuditLogs(page);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Auditoría"
        description="Registro de todas las acciones de escritura realizadas en el sistema."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha / hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>ID entidad</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
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
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Sin registros de auditoría todavía.
                </TableCell>
              </TableRow>
            )}
            {result?.data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                </TableCell>
                <TableCell className="text-sm">{log.userEmail ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={ACTION_VARIANT[log.action]}>{ACTION_LABEL[log.action]}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{log.entity}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.entityId ? log.entityId.slice(0, 8) + '…' : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.ipAddress ?? '—'}
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
    </div>
  );
}
