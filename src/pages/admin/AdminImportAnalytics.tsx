import { useImportAnalytics } from '@/hooks/useImportAnalytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Target, CheckCircle, AlertTriangle, TrendingUp, Database, Users, DollarSign, Flame, Bot, Cpu } from 'lucide-react';

function KpiCard({ title, value, target, icon: Icon, description }: {
  title: string; value: number; target: number; icon: React.ElementType; description: string;
}) {
  const color = value >= target ? 'text-green-600' : value >= target - 5 ? 'text-amber-500' : 'text-destructive';
  const bgColor = value >= target ? 'bg-green-50' : value >= target - 5 ? 'bg-amber-50' : 'bg-red-50';
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value}%</div>
        <p className="text-xs text-muted-foreground mt-1">Target: {target}% — {description}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'completed' ? 'default' : status === 'processing' ? 'secondary' : 'outline';
  return <Badge variant={variant} className="text-xs">{status}</Badge>;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const COST_ICONS: Record<string, React.ElementType> = {
  firecrawl: Flame,
  apify: Bot,
  ai_tokens: Cpu,
};

const COST_LABELS: Record<string, string> = {
  firecrawl: 'Firecrawl Credits',
  apify: 'Apify Calls',
  ai_tokens: 'AI Tokens',
};

export default function AdminImportAnalytics() {
  const { data, isLoading } = useImportAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Import Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">No import data available.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Import Health</h2>
        <p className="text-sm text-muted-foreground">Pipeline performance across all agencies</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Discovery Rate" value={data.discoveryRate} target={90} icon={Target} description="URLs found vs source pages" />
        <KpiCard title="Extraction Accuracy" value={data.extractionAccuracy} target={85} icon={CheckCircle} description="High-confidence extractions (≥70)" />
        <KpiCard title="Import Success Rate" value={data.importSuccessRate} target={95} icon={TrendingUp} description="Successful vs non-skipped items" />
      </div>

      {/* Summary Stats + Cost Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{data.totalJobs}</div>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{data.totalItems.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Items Processed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{data.uniqueAgencies}</div>
              <p className="text-xs text-muted-foreground">Agencies</p>
            </div>
          </CardContent>
        </Card>
        {data.costSummary.map(c => {
          const CostIcon = COST_ICONS[c.resourceType] || DollarSign;
          return (
            <Card key={c.resourceType}>
              <CardContent className="pt-6 flex items-center gap-3">
                <CostIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{c.totalQuantity.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{COST_LABELS[c.resourceType] || c.resourceType}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Success %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sourceBreakdown.map(s => (
                  <TableRow key={s.source}>
                    <TableCell className="font-medium capitalize">{s.source}</TableCell>
                    <TableCell className="text-right">{s.jobs}</TableCell>
                    <TableCell className="text-right">{s.items}</TableCell>
                    <TableCell className="text-right">{s.successRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                {data.sourceBreakdown.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Error Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error Types</CardTitle>
            <CardDescription>Distribution of failure reasons</CardDescription>
          </CardHeader>
          <CardContent>
            {data.errorBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.errorBreakdown.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="errorType" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.errorBreakdown.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={`hsl(var(--destructive))`} opacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No errors recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confidence Distribution</CardTitle>
            <CardDescription>Score buckets for extracted listings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.confidenceBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.confidenceBuckets.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agency Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agency Leaderboard</CardTitle>
            <CardDescription>Top agencies by import volume</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Success %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.agencyLeaderboard.map(a => (
                  <TableRow key={a.agencyId}>
                    <TableCell className="font-medium text-sm truncate max-w-[160px]">{a.agencyName}</TableCell>
                    <TableCell className="text-right">{a.items}</TableCell>
                    <TableCell className="text-right">{a.successRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Import Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Website</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">URLs</TableHead>
                <TableHead className="text-right">Processed</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">🔥 FC</TableHead>
                <TableHead className="text-right">🤖 AP</TableHead>
                <TableHead className="text-right">🧠 AI</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentJobs.map(j => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium text-sm truncate max-w-[200px]">
                    {j.websiteUrl ? new URL(j.websiteUrl).hostname.replace('www.', '') : '—'}
                  </TableCell>
                  <TableCell className="capitalize text-sm">{j.importType}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                  <TableCell className="text-right">{j.totalUrls}</TableCell>
                  <TableCell className="text-right">{j.processedCount}</TableCell>
                  <TableCell className="text-right">{j.failedCount}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{j.costs.firecrawl || '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{j.costs.apify || '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{j.costs.aiTokens ? j.costs.aiTokens.toLocaleString() : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(j.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
