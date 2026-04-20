/**
 * AdminColistingTelemetry — at-a-glance health of the co-listing system.
 *
 * Single RPC round-trip (get_colisting_telemetry) returns every metric the
 * ops team cares about: coverage, transition volume, dispute queue,
 * boost activity, cluster reports, per-agency averages.
 *
 * Refetches every 5 minutes. Empty state for a fresh deployment.
 */
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity, TrendingUp, Gavel, Flag, Sparkles, RefreshCw,
  Building2, History, BarChart3, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useColistingTelemetry } from '@/hooks/useAdminColisting';

function Tile({
  label, value, icon: Icon, hint, variant = 'default',
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  hint?: string;
  variant?: 'default' | 'warn' | 'success';
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p
              className={cn(
                'text-2xl font-bold',
                variant === 'warn' && 'text-semantic-amber',
                variant === 'success' && 'text-semantic-green',
              )}
            >
              {value}
            </p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              variant === 'warn' ? 'text-semantic-amber'
                : variant === 'success' ? 'text-semantic-green'
                : 'text-muted-foreground',
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

const REASON_LABELS: Record<string, string> = {
  first_import:       'First import',
  manual_upgrade:     'Manual upgrade',
  boost_start:        'Boost start',
  boost_end:          'Boost end',
  admin_override:     'Admin override',
  agency_churn:       'Agency churn',
  stale_demotion:     'Stale demotion',
  dispute_resolution: 'Dispute resolution',
  legacy_migration:   'Legacy migration',
};

export default function AdminColistingTelemetry() {
  const { data, isLoading, error } = useColistingTelemetry();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Co-listing telemetry
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Live health metrics. Refreshes every 5 minutes.
          {data?.generated_at && (
            <> · Last generated {formatDistanceToNow(new Date(data.generated_at), { addSuffix: true })}.</>
          )}
        </p>
      </div>

      {error ? (
        <Card className="rounded-xl border-destructive/30">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-foreground font-medium">Failed to load telemetry</p>
            <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Coverage */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Coverage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Tile
                label="Published properties"
                value={data.coverage.published_properties}
                icon={Building2}
              />
              <Tile
                label="With ≥1 co-agent"
                value={data.coverage.with_co_agents}
                icon={Building2}
              />
              <Tile
                label="Coverage"
                value={`${data.coverage.coverage_pct}%`}
                icon={TrendingUp}
                hint="Honest multi-agency representation"
                variant={data.coverage.coverage_pct >= 5 ? 'success' : 'default'}
              />
            </div>
          </section>

          {/* Transitions last 7 days */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Primary transitions (last 7 days)
            </h3>
            {Object.keys(data.transitions_7d).length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  No primary transitions in the last 7 days.
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.transitions_7d)
                  .sort((a, b) => b[1] - a[1])
                  .map(([reason, count]) => (
                    <Badge
                      key={reason}
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                    >
                      {REASON_LABELS[reason] ?? reason}
                      <span className="ml-1.5 font-semibold">{count}</span>
                    </Badge>
                  ))}
              </div>
            )}
          </section>

          {/* Disputes */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" />
              Disputes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Tile
                label="Open now"
                value={data.disputes.open_now}
                icon={Gavel}
                variant={data.disputes.open_now > 0 ? 'warn' : 'default'}
              />
              <Tile
                label="Filed (30 days)"
                value={data.disputes.filed_30d}
                icon={Gavel}
              />
              <Tile
                label="Upheld ratio (30d)"
                value={
                  (data.disputes.by_status_30d?.resolved_uphold ?? 0) +
                  (data.disputes.by_status_30d?.resolved_dismiss ?? 0) > 0
                    ? `${Math.round(
                        (100 * (data.disputes.by_status_30d?.resolved_uphold ?? 0)) /
                        ((data.disputes.by_status_30d?.resolved_uphold ?? 0) +
                         (data.disputes.by_status_30d?.resolved_dismiss ?? 0)),
                      )}%`
                    : '—'
                }
                icon={TrendingUp}
                hint="Upheld vs (upheld + dismissed)"
              />
            </div>
          </section>

          {/* Boosts */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Boosts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Tile
                label="Active right now"
                value={data.boosts.active_now}
                icon={Sparkles}
                variant="success"
              />
              <Tile
                label="Activations (30 days)"
                value={data.boosts.activations_30d}
                icon={TrendingUp}
              />
            </div>
          </section>

          {/* Cluster reports + stale */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Reports & scraper health
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Tile
                label="Open cluster reports"
                value={data.reports.open_now}
                icon={Flag}
                variant={data.reports.open_now > 0 ? 'warn' : 'default'}
              />
              <Tile
                label="Reports filed (30d)"
                value={data.reports.filed_30d}
                icon={Flag}
              />
              <Tile
                label="Stale demotions (30d)"
                value={data.stale_demotions_30d}
                icon={RefreshCw}
                hint="Scrape-only primaries auto-replaced"
              />
            </div>
          </section>

          {/* Per-agency averages */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Per-agency inventory (averages)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Tile
                label="Avg primary listings / agency"
                value={data.per_agency.avg_primary_listings}
                icon={Building2}
              />
              <Tile
                label="Avg co-agent rows / agency"
                value={data.per_agency.avg_co_agent_rows}
                icon={Building2}
              />
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}
