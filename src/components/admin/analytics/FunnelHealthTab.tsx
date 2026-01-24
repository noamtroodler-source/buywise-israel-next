import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, TrendingDown, Calendar } from 'lucide-react';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface FunnelHealthTabProps {
  dateRange: number;
}

export function FunnelHealthTab({ dateRange }: FunnelHealthTabProps) {
  const { data, isLoading } = useFunnelAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const metrics = data?.metrics;

  const formatMilestone = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Milestones</p>
                <p className="text-3xl font-bold">{metrics?.totalMilestones || 0}</p>
              </div>
              <Target className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-3xl font-bold">{metrics?.uniqueUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Sessions</p>
                <p className="text-3xl font-bold">{metrics?.uniqueSessions || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestone Progression Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.milestoneProgress && data.milestoneProgress.length > 0 ? (
            <div className="space-y-3">
              {data.milestoneProgress.map((milestone, i) => (
                <div key={milestone.milestone} className="relative">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <span className="font-medium">{formatMilestone(milestone.milestone)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{milestone.reached} users</span>
                      <Badge variant="outline">{milestone.percentage.toFixed(0)}%</Badge>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute left-12 right-0 bottom-0 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${milestone.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No funnel data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Drop-off Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Drop-off Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.milestoneDropoff && data.milestoneDropoff.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.milestoneDropoff}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="from" 
                  className="text-xs"
                  tickFormatter={(value) => formatMilestone(value).split(' ')[0]}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  labelFormatter={(label) => `${formatMilestone(label)} → Next`}
                />
                <Bar 
                  dataKey="dropoffRate" 
                  fill="hsl(0 84% 60%)" 
                  radius={[4, 4, 0, 0]} 
                  name="Drop-off Rate" 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Not enough data for drop-off analysis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestone Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.milestoneTrend && data.milestoneTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.milestoneTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={(d) => Object.values(d.milestones).reduce((a: number, b) => a + (b as number), 0)} 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  name="Total Milestones"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
