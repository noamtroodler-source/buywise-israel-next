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
  users: { icon: UserPlus, label: 'Users' },
  properties: { icon: Home, label: 'Properties' },
  inquiries: { icon: MessageSquare, label: 'Inquiries' },
  views: { icon: Eye, label: 'Views' },
  agents: { icon: Users, label: 'Agents' },
};

export function GrowthMetrics({ data, trendData, isLoading, periodLabel = 'vs previous period' }: GrowthMetricsProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50">
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
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Growth Metrics
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {periodLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Growth Cards */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {metrics.map((metric) => {
            const config = METRIC_CONFIG[metric.key as keyof typeof METRIC_CONFIG];
            const Icon = config.icon;
            const isPositive = metric.change > 0;
            const isNeutral = metric.change === 0;
            
            return (
              <div 
                key={metric.key}
                className="p-3 rounded-xl bg-primary/5 text-center"
              >
                <div className="flex items-center justify-center mb-1">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl font-bold text-foreground">{metric.current}</p>
                <p className="text-xs text-muted-foreground mb-1">{config.label}</p>
                <div className={`flex items-center justify-center gap-1 text-xs ${
                  isNeutral ? 'text-muted-foreground' : 'text-primary'
                }`}>
                  {isPositive ? (
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
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm font-semibold mb-3 text-foreground">Activity Trend</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border/50 rounded-xl shadow-lg p-2 text-sm">
                          <p className="font-semibold text-foreground">{label}</p>
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
                  stroke="hsl(213, 60%, 65%)" 
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