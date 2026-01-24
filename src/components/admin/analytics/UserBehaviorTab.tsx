import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserBehaviorMetrics } from '@/hooks/useAnalyticsData';
import { Loader2, Monitor, Smartphone, Tablet, Clock, MousePointer, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const DEVICE_COLORS = {
  desktop: 'hsl(var(--primary))',
  mobile: 'hsl(var(--chart-2))',
  tablet: 'hsl(var(--chart-3))',
  unknown: 'hsl(var(--muted-foreground))',
};

interface UserBehaviorTabProps {
  dateRange: number;
}

export function UserBehaviorTab({ dateRange }: UserBehaviorTabProps) {
  const { data, isLoading } = useUserBehaviorMetrics(dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No behavior data available yet. Events will appear as users interact with the platform.
      </div>
    );
  }

  const { sessionMetrics, topPages, devices, hourlyActivity } = data;

  const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Session Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MousePointer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessionMetrics.totalSessions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <ArrowUpRight className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessionMetrics.avgPagesPerSession}</p>
                <p className="text-sm text-muted-foreground">Pages / Session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessionMetrics.avgSessionDuration}m</p>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">{sessionMetrics.bounceRate}%</p>
              <p className="text-sm text-muted-foreground">Bounce Rate</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Single page visits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topPages.slice(0, 10).map((page, idx) => (
                <div key={page.path} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                    <span className="text-sm font-mono truncate max-w-[200px]" title={page.path}>
                      {page.path}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{page.uniqueSessions} sessions</p>
                  </div>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No page data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devices}
                      dataKey="count"
                      nameKey="device"
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                    >
                      {devices.map((entry) => (
                        <Cell 
                          key={entry.device} 
                          fill={DEVICE_COLORS[entry.device as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.unknown} 
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {devices.map((device) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {deviceIcons[device.device] || <Monitor className="h-4 w-4" />}
                      <span className="capitalize">{device.device}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{Math.round(device.percentage)}%</span>
                      <span className="text-muted-foreground text-sm ml-2">({device.count.toLocaleString()})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity by Hour of Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyActivity}>
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(h) => `${h}:00`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Events']}
                  labelFormatter={(h) => `${h}:00 - ${h}:59`}
                />
                <Area 
                  type="monotone" 
                  dataKey="events" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary)/0.2)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
