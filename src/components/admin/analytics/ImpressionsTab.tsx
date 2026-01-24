import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MousePointer, TrendingUp, Zap } from 'lucide-react';
import { useImpressionAnalytics } from '@/hooks/useImpressionAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ImpressionsTabProps {
  dateRange: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

export function ImpressionsTab({ dateRange }: ImpressionsTabProps) {
  const { data, isLoading } = useImpressionAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const metrics = data?.metrics;
  const positionData = data?.positionPerformance || [];
  const entityData = data?.entityTypeBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-3xl font-bold">{metrics?.totalImpressions.toLocaleString() || 0}</p>
              </div>
              <Eye className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visible Views</p>
                <p className="text-3xl font-bold">{metrics?.totalClicks.toLocaleString() || 0}</p>
              </div>
              <MousePointer className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visibility Rate</p>
                <p className="text-3xl font-bold">{metrics?.overallCTR.toFixed(1) || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Time Visible</p>
                <p className="text-3xl font-bold">{((metrics?.avgTimeVisible || 0) / 1000).toFixed(1)}s</p>
              </div>
              <Zap className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Position Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Position</CardTitle>
          </CardHeader>
          <CardContent>
            {positionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={positionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="positionRange" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Impressions" />
                  <Bar dataKey="ctr" fill="hsl(var(--primary)/0.5)" radius={[4, 4, 0, 0]} name="Visibility %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No impression data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Entity Type</CardTitle>
          </CardHeader>
          <CardContent>
            {entityData.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={entityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="impressions"
                      nameKey="entityType"
                      label={({ entityType, percentage }) => `${entityType}: ${percentage?.toFixed(1)}%`}
                    >
                      {entityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promoted vs Organic */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Promoted vs Organic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Promoted</span>
                <Badge variant="secondary">{metrics?.promotedCTR.toFixed(1)}% visibility</Badge>
              </div>
              <p className="text-2xl font-bold">{metrics?.promotedImpressions.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">impressions</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Organic</span>
                <Badge variant="outline">{metrics?.organicCTR.toFixed(1)}% visibility</Badge>
              </div>
              <p className="text-2xl font-bold">{metrics?.organicImpressions.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">impressions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Filter Combinations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Search Filter Combinations</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.filterPerformance && data.filterPerformance.length > 0 ? (
            <div className="space-y-3">
              {data.filterPerformance.slice(0, 5).map((filter, i) => (
                <div key={filter.filterHash} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">{filter.filterHash.slice(0, 12)}...</code>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{filter.impressions} impressions</span>
                    <Badge variant="outline">{filter.ctr.toFixed(1)}% visibility</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No filter data available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
