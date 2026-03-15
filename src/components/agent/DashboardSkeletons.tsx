import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SnapshotStripSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/40 mr-1.5">·</span>}
          <Skeleton className="h-5 w-8 rounded-lg" />
          <Skeleton className="h-4 w-14 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-border/50 bg-card min-h-[96px]">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-3 w-12 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function PerformanceSkeleton() {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentPropertiesSkeleton() {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-14 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SidebarCardSkeleton() {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
    </div>
  );
}
