'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from 'lucide-react';
import { useTraceability } from '@/hooks/use-production';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TraceabilityPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [lotId, setLotId] = useState('');

  const { data, isLoading, isError } = useTraceability(lotId, 'full');

  function handleSearch() {
    const trimmed = input.trim();
    if (trimmed) setLotId(trimmed);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/production')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Trazabilidad</h1>
      </div>

      <div className="flex gap-2 max-w-lg">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="lotId">ID del lote terminado</Label>
          <Input
            id="lotId"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="UUID del lote…"
            className="font-mono text-sm"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
      </div>

      {isLoading && lotId && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">No se encontró el lote o ocurrió un error.</p>
      )}

      {!!data && !isLoading && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Resultado — Lote {lotId}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded-md p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
