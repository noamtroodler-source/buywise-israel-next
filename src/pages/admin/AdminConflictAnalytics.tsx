/**
 * AdminConflictAnalytics — /admin/cross-agency-conflicts/analytics
 * Dashboard showing conflict patterns, top offenders, and resolution metrics.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Clock, ShieldCheck, TrendingUp, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConflictAnalytics } from '@/hooks/useConflictAnalytics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  co_listing_confirmed: 'Co-listing',
  existing_agency_confirmed: 'Existing agency owns',
  attempted_agency_confirmed: 'Transferred',
  dismissed: 'Dismissed',
};

export default function AdminConflictAnalytics() {
  const { data, isLoading } = useConflictAnalytics();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          to="/admin/cross-agency-conflicts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to conflicts
        </Link>

        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Conflict analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Cross-agency dispute patterns, response times, and automation efficacy.
          </p>
        </header>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total conflicts</p>
                  <p className="text-2xl font-bold">{data.total}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Pending review</p>
                  <p className="text-2xl font-bold text-amber-600">{data.pending}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Auto-resolved
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {data.autoResolved}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({data.autoResolveRate.toFixed(0)}%)
                    </span>
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Avg resolution time
                  </p>
                  <p className="text-2xl font-bold">
                    {data.avgResolutionHours == null ? '—' : `${data.avgResolutionHours}h`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 14-day trend */}
            <Card className="rounded-2xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Conflicts over the last 14 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.recentTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="day"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Top offenders */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Most-disputed agencies</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.byAgency.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.byAgency} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="agency_name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            width={120}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="conflict_count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resolution breakdown */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resolution outcomes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(data.byStatus).length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
                  )}
                  {Object.entries(data.byStatus).map(([status, count]) => {
                    const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{STATUS_LABEL[status] || status}</span>
                          <span className="text-muted-foreground">
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Source breakdown */}
            {Object.keys(data.bySource).length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Conflicts by source type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(data.bySource).map(([source, count]) => (
                      <div key={source} className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted-foreground capitalize">{source.replace('_', ' ')}</p>
                        <p className="text-xl font-bold">{count}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
