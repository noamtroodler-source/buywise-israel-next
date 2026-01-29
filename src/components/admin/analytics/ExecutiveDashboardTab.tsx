import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle2, Info, Eye, MessageSquare, Users, 
  Search, Heart, Bug, Activity, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  useExecutiveMetrics, 
  useJourneyStages, 
  useAnomalyAlerts,
  usePriceAlertEffectiveness,
  HealthMetric,
  AlertItem 
} from '@/hooks/useExecutiveDashboard';

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Property Views': Eye,
  'Inquiries': MessageSquare,
  'New Users': Users,
  'Searches': Search,
  'Properties Saved': Heart,
  'Client Errors': Bug,
};

const statusColors = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

const statusBg = {
  green: 'bg-emerald-500/10 border-emerald-500/20',
  yellow: 'bg-amber-500/10 border-amber-500/20',
  red: 'bg-red-500/10 border-red-500/20',
};

interface ExecutiveDashboardTabProps {
  dateRange: number;
}

function MetricCard({ metric, index }: { metric: HealthMetric; index: number }) {
  const Icon = metricIcons[metric.label] || Activity;
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn("border", statusBg[metric.status])}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", statusColors[metric.status])} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {metric.label}
              </span>
            </div>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {metric.current.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                vs {metric.previous.toLocaleString()} prev
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              metric.trend === 'up' && metric.label !== 'Client Errors' ? 'text-emerald-600' : 
              metric.trend === 'down' && metric.label !== 'Client Errors' ? 'text-red-600' :
              metric.trend === 'up' && metric.label === 'Client Errors' ? 'text-red-600' :
              metric.trend === 'down' && metric.label === 'Client Errors' ? 'text-emerald-600' :
              'text-muted-foreground'
            )}>
              <TrendIcon className="h-4 w-4" />
              <span>{Math.abs(metric.changePercent).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const icons = {
    critical: AlertTriangle,
    warning: AlertTriangle,
    info: alert.title === 'All Systems Normal' ? CheckCircle2 : Info,
  };
  const Icon = icons[alert.type];

  const colors = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-700',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
    info: alert.title === 'All Systems Normal' 
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
      : 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  };

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg border", colors[alert.type])}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{alert.title}</p>
        <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
        {alert.currentValue !== undefined && alert.threshold !== undefined && (
          <div className="mt-2">
            <Progress 
              value={Math.min((alert.currentValue / (alert.threshold * 2)) * 100, 100)} 
              className="h-1.5"
            />
            <p className="text-xs mt-1 opacity-70">
              {alert.currentValue.toFixed(1)} / {alert.threshold} threshold
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function JourneyFunnel({ stages }: { stages: { stage: string; count: number; percentage: number }[] }) {
  const stageLabels: Record<string, string> = {
    awareness: 'Awareness',
    consideration: 'Consideration',
    decision: 'Decision',
    action: 'Action',
    retention: 'Retention',
  };

  const stageColors: Record<string, string> = {
    awareness: 'bg-blue-500',
    consideration: 'bg-indigo-500',
    decision: 'bg-violet-500',
    action: 'bg-purple-500',
    retention: 'bg-pink-500',
  };

  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div key={stage.stage} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{stageLabels[stage.stage] || stage.stage}</span>
            <span className="text-muted-foreground">
              {stage.count} ({stage.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stage.percentage}%` }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={cn("h-full rounded-full", stageColors[stage.stage])}
            />
          </div>
        </div>
      ))}
      {total === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No journey data yet. Journeys are tracked automatically as users interact.
        </p>
      )}
    </div>
  );
}

function PriceAlertStats({ data }: { data: ReturnType<typeof usePriceAlertEffectiveness>['data'] }) {
  if (!data || data.total === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No price alerts sent yet in this period.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold">{data.total}</p>
          <p className="text-xs text-muted-foreground">Alerts Sent</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold">{data.openRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Open Rate</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Click-through</span>
          <span className="font-medium">{data.clickRate.toFixed(1)}%</span>
        </div>
        <Progress value={data.clickRate} className="h-2" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Conversion (inquiry/save)</span>
          <span className="font-medium">{data.conversionRate.toFixed(1)}%</span>
        </div>
        <Progress value={data.conversionRate} className="h-2" />
      </div>
    </div>
  );
}

export function ExecutiveDashboardTab({ dateRange }: ExecutiveDashboardTabProps) {
  const { data: metrics, isLoading: metricsLoading } = useExecutiveMetrics(dateRange);
  const { data: journeyStages, isLoading: journeyLoading } = useJourneyStages();
  const { data: alerts, isLoading: alertsLoading } = useAnomalyAlerts(dateRange);
  const { data: priceAlerts, isLoading: priceAlertsLoading } = usePriceAlertEffectiveness(dateRange);

  const healthScore = metrics 
    ? Math.round(metrics.filter(m => m.status === 'green').length / metrics.length * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Health Score Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Platform Health Score</h3>
              <p className="text-sm text-muted-foreground">
                Based on {dateRange}-day period vs previous {dateRange} days
              </p>
            </div>
            <div className="text-right">
              {metricsLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <>
                  <p className={cn(
                    "text-4xl font-bold",
                    healthScore >= 70 ? "text-emerald-600" :
                    healthScore >= 40 ? "text-amber-600" : "text-red-600"
                  )}>
                    {healthScore}%
                  </p>
                  <Badge variant={healthScore >= 70 ? "default" : healthScore >= 40 ? "secondary" : "destructive"}>
                    {healthScore >= 70 ? "Healthy" : healthScore >= 40 ? "Needs Attention" : "Critical"}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          metrics?.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} index={index} />
          ))
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Anomaly Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : (
              alerts?.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            )}
          </CardContent>
        </Card>

        {/* User Journey Funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              User Journey Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {journeyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <JourneyFunnel stages={journeyStages || []} />
            )}
          </CardContent>
        </Card>

        {/* Price Alert Effectiveness */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-500" />
              Price Alert Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priceAlertsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <PriceAlertStats data={priceAlerts} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
