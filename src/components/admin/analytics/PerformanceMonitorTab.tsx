import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle, CheckCircle, XCircle, Globe, Clock } from 'lucide-react';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PerformanceMonitorTabProps {
  dateRange: number;
}

export function PerformanceMonitorTab({ dateRange }: PerformanceMonitorTabProps) {
  const { data, isLoading } = usePerformanceAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const perf = data?.performanceMetrics;
  const errors = data?.errorMetrics;

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'needs-improvement': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'poor': return 'bg-red-500/20 text-red-700 border-red-500/30';
    }
  };

  const getRatingIcon = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'needs-improvement': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'poor': return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={`border ${getRatingColor(perf?.lcpRating || 'good')}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getRatingIcon(perf?.lcpRating || 'good')}
                <span className="text-sm font-medium">LCP</span>
              </div>
              <Badge variant="outline" className={getRatingColor(perf?.lcpRating || 'good')}>
                {perf?.lcpRating || 'good'}
              </Badge>
            </div>
            <p className="text-3xl font-bold">{((perf?.avgLCP || 0) / 1000).toFixed(2)}s</p>
            <p className="text-xs text-muted-foreground mt-1">Largest Contentful Paint</p>
            <p className="text-xs text-muted-foreground">Target: &lt; 2.5s</p>
          </CardContent>
        </Card>

        <Card className={`border ${getRatingColor(perf?.clsRating || 'good')}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getRatingIcon(perf?.clsRating || 'good')}
                <span className="text-sm font-medium">CLS</span>
              </div>
              <Badge variant="outline" className={getRatingColor(perf?.clsRating || 'good')}>
                {perf?.clsRating || 'good'}
              </Badge>
            </div>
            <p className="text-3xl font-bold">{(perf?.avgCLS || 0).toFixed(3)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cumulative Layout Shift</p>
            <p className="text-xs text-muted-foreground">Target: &lt; 0.1</p>
          </CardContent>
        </Card>

        <Card className={`border ${getRatingColor(perf?.inpRating || 'good')}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getRatingIcon(perf?.inpRating || 'good')}
                <span className="text-sm font-medium">INP</span>
              </div>
              <Badge variant="outline" className={getRatingColor(perf?.inpRating || 'good')}>
                {perf?.inpRating || 'good'}
              </Badge>
            </div>
            <p className="text-3xl font-bold">{Math.round(perf?.avgINP || 0)}ms</p>
            <p className="text-xs text-muted-foreground mt-1">Interaction to Next Paint</p>
            <p className="text-xs text-muted-foreground">Target: &lt; 200ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <p className="text-sm text-muted-foreground">Total Errors</p>
              <p className="text-2xl font-bold">{errors?.totalErrors || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground">JS Errors</p>
              <p className="text-2xl font-bold">{errors?.jsErrors || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground">Map Failures</p>
              <p className="text-2xl font-bold">{errors?.mapFailures || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground">API Errors</p>
              <p className="text-2xl font-bold">{errors?.apiErrors || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Slowest Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Slowest Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.slowestRoutes && data.slowestRoutes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.slowestRoutes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis 
                    dataKey="pagePath" 
                    type="category" 
                    className="text-xs" 
                    width={120}
                    tickFormatter={(path) => path.length > 15 ? `${path.slice(0, 15)}...` : path}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${Math.round(value)}ms`}
                  />
                  <Bar dataKey="avgLoadTime" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Avg Load Time" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No route performance data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Error Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.errorTrend && data.errorTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.errorTrend}>
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
                  <Line type="monotone" dataKey="errors" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No error trend data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Integration Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.integrationHealth && data.integrationHealth.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.integrationHealth.map((integration) => (
                <div key={integration.integrationType} className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{integration.integrationType.replace(/_/g, ' ')}</span>
                    <Badge 
                      variant={integration.successRate >= 99 ? "default" : integration.successRate >= 95 ? "secondary" : "destructive"}
                      className={integration.successRate >= 99 ? "bg-green-500/20 text-green-700" : ""}
                    >
                      {integration.successRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Avg Response</p>
                      <p className="font-medium">{Math.round(integration.avgResponseTime)}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Samples</p>
                      <p className="font-medium">{integration.samples}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No integration health data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
