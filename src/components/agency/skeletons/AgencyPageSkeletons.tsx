import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';

/**
 * Shared skeleton building blocks for agency pages.
 * Each page composes these into a page-level skeleton.
 */

/* ── Tiny helpers ────────────────────────────────── */

function HeaderSkeleton({ withBackButton = true }: { withBackButton?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {withBackButton && <Skeleton className="h-10 w-10 rounded-xl" />}
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="rounded-2xl border-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/50">
      <Skeleton className="h-12 w-16 rounded-lg flex-shrink-0" />
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

/* ── Page-level skeletons ────────────────────────── */

export function AgencyDashboardSkeleton() {
  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <HeaderSkeleton />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        {/* Snapshot strip */}
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>

        {/* Performance + sidebar */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function AgencyAnalyticsSkeleton() {
  return (
    <Layout>
      <div className="container py-8 max-w-6xl space-y-6">
        <Skeleton className="h-9 w-40 rounded-xl" />

        {/* Gradient header */}
        <Skeleton className="h-24 rounded-2xl" />

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Funnel */}
        <Skeleton className="h-32 rounded-2xl" />

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </Layout>
  );
}

export function AgencyTeamSkeleton() {
  return (
    <Layout>
      <div className="container py-8 max-w-4xl space-y-6">
        <HeaderSkeleton />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export function AgencyFeaturedSkeleton() {
  return (
    <Layout>
      <div className="container py-8 space-y-6 max-w-4xl">
        <HeaderSkeleton />
        <Skeleton className="h-20 rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    </Layout>
  );
}

export function AgencyBlogSkeleton() {
  return (
    <Layout>
      <div className="container py-8 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <HeaderSkeleton />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export function AgencySettingsSkeleton() {
  return (
    <Layout>
      <div className="container py-8 max-w-3xl space-y-8">
        <div>
          <Skeleton className="h-9 w-40 rounded-xl mb-4" />
          <HeaderSkeleton withBackButton={false} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}

export function AgencyListingsSkeleton() {
  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <HeaderSkeleton />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Filters */}
        <Skeleton className="h-14 rounded-2xl" />

        {/* Table rows */}
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
