import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Users, Home, MessageSquare, Eye, UserPlus } from 'lucide-react';
import { GrowthData, TrendDataPoint } from '@/hooks/useGrowthMetrics';
import { 
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, CartesianGrid 
} from 'recharts';

interface GrowthMetricsProps {
  data: GrowthData | undefined;
  trendData: TrendDataPoint[] | undefined;
  isLoading?: boolean;
  periodLabel?: string;
}

const METRIC_CONFIG = {
  users: { icon: UserPlus, color: 'hsl(var(--primary))' },
  properties: { icon: Home, color: 'hsl(190, 80%, 42%)' },
  inquiries: { icon: MessageSquare, color: 'hsl(258, 55%, 52%)' },
  views: { icon: Eye, color: 'hsl(142, 71%, 45%)' },
  agents: { icon: Users, color: 'hsl(45, 93%, 47%)' },
};

export function GrowthMetrics({ data, trendData, isLoading, periodLabel = 'vs previous period' }: GrowthMetricsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const metrics = data ? [
    { key: 'users', ...data.users },
    { key: 'properties', ...data.properties },
    { key: 'inquiries', ...data.inquiries },
    { key: 'views', ...data.views },
    { key: 'agents', ...data.agents },
  ] : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Growth Metrics
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {periodLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Growth Cards */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {metrics.map((metric) => {
            const config = METRIC_CONFIG[metric.key as keyof typeof METRIC_CONFIG];
            const Icon = config.icon;
            
            return (
              <div 
                key={metric.key}
                className="p-3 rounded-lg bg-muted/30 text-center"
              >
                <div className="flex items-center justify-center mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold">{metric.current}</p>
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <div className={`flex items-center justify-center gap-1 text-xs ${
                  metric.isPositive ? 'text-green-600' : metric.change === 0 ? 'text-muted-foreground' : 'text-red-600'
                }`}>
                  {metric.change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : metric.change < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  <span>
                    {metric.change > 0 ? '+' : ''}{metric.change}
                    {metric.changePercent !== 0 && ` (${metric.changePercent > 0 ? '+' : ''}${metric.changePercent.toFixed(0)}%)`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend Chart */}
        {trendData && trendData.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Activity Trend</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                          <p className="font-medium">{label}</p>
                          {payload.map((entry) => (
                            <p key={entry.dataKey} className="text-muted-foreground">
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  name="Users"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="inquiries" 
                  name="Inquiries"
                  stroke="hsl(258, 55%, 52%)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
