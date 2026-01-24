import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useToolAnalytics } from '@/hooks/useToolAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ToolPerformanceTabProps {
  dateRange: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

export function ToolPerformanceTab({ dateRange }: ToolPerformanceTabProps) {
  const { data, isLoading } = useToolAnalytics(dateRange);

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
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatToolName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-3xl font-bold">{metrics?.totalRuns || 0}</p>
              </div>
              <Calculator className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold">{metrics?.completionRate.toFixed(1) || 0}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abandoned</p>
                <p className="text-3xl font-bold">{metrics?.abandonedRuns || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-3xl font-bold">{formatDuration(metrics?.avgDurationMs || 0)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tool Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance by Tool</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.toolPerformance && data.toolPerformance.length > 0 ? (
            <div className="space-y-3">
              {data.toolPerformance.map((tool) => (
                <div key={tool.toolName} className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{formatToolName(tool.toolName)}</h4>
                    <Badge 
                      variant={tool.completionRate >= 70 ? "default" : tool.completionRate >= 50 ? "secondary" : "destructive"}
                      className={tool.completionRate >= 70 ? "bg-green-500/20 text-green-700" : ""}
                    >
                      {tool.completionRate.toFixed(0)}% completion
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Runs</p>
                      <p className="font-medium">{tool.runs}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium text-green-600">{tool.completed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Abandoned</p>
                      <p className="font-medium text-red-600">{tool.abandoned}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Time</p>
                      <p className="font-medium">{formatDuration(tool.avgDurationMs)}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${tool.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No tool usage data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next Action Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRight className="h-5 w-5" />
              Next Action After Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.nextActionDistribution && data.nextActionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.nextActionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="action"
                    label={({ action, percentage }) => `${action}: ${percentage.toFixed(0)}%`}
                  >
                    {data.nextActionDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No next action data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tool Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.usageTrend && data.usageTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.usageTrend}>
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
                  <Line type="monotone" dataKey="runs" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Runs" />
                  <Line type="monotone" dataKey="completions" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} name="Completions" />
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

      {/* Step Abandonment */}
      {data?.stepAbandonment && data.stepAbandonment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step Abandonment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.stepAbandonment}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="stepName" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="abandonmentRate" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} name="Abandonment Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
