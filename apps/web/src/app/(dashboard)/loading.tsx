import { Skeleton } from '@/components/ui/skeleton';

/**
 * Default loading fallback for the dashboard segment. Used by Next.js while
 * a server component is suspending or a route transition is in flight.
 * Renders a generic header + 3 stat cards + a chart skeleton so the layout
 * doesn't jump on hydration.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}
