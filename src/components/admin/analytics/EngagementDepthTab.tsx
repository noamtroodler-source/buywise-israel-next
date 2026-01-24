import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Scroll, MousePointer, LogOut } from 'lucide-react';
import { useEngagementAnalytics } from '@/hooks/useEngagementAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface EngagementDepthTabProps {
  dateRange: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

export function EngagementDepthTab({ dateRange }: EngagementDepthTabProps) {
  const { data, isLoading } = useEngagementAnalytics(dateRange);

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
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold">{metrics?.totalSessions.toLocaleString() || 0}</p>
              </div>
              <MousePointer className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
                <p className="text-3xl font-bold">{metrics?.engagementRate.toFixed(1) || 0}%</p>
              </div>
              <Clock className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Active Time</p>
                <p className="text-3xl font-bold">{formatTime(metrics?.avgActiveTime || 0)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Scroll Depth</p>
                <p className="text-3xl font-bold">{metrics?.avgScrollDepth.toFixed(0) || 0}%</p>
              </div>
              <Scroll className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Page Type Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Time by Page Type</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pageTypeEngagement && data.pageTypeEngagement.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.pageTypeEngagement} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="pageType" type="category" className="text-xs" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatTime(value)}
                  />
                  <Bar dataKey="avgActiveTime" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Avg Active Time" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No engagement data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scroll Depth Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scroll Depth Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.scrollDepthDistribution && data.scrollDepthDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.scrollDepthDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="range"
                    label={({ range, percentage }) => `${range}: ${percentage.toFixed(0)}%`}
                  >
                    {data.scrollDepthDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exit Type & Engagement Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exit Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LogOut className="h-5 w-5" />
              Exit Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.exitTypeBreakdown?.map((exit) => (
                <div key={exit.exitType} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="capitalize font-medium">{exit.exitType}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{exit.count} sessions</span>
                    <Badge variant="outline">{exit.percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
              {(!data?.exitTypeBreakdown || data.exitTypeBreakdown.length === 0) && (
                <p className="text-center text-muted-foreground py-4">No exit data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.engagementTrend && data.engagementTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.engagementTrend}>
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
                    dataKey="engagementRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name="Engagement Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
