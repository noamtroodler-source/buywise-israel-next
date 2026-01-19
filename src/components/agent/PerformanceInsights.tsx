import { TrendingUp, TrendingDown, Eye, MessageSquare, Home, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PerformanceMetric {
  label: string;
  current: number;
  previous: number;
  icon: React.ElementType;
  format?: 'number' | 'percent';
}

interface PerformanceInsightsProps {
  metrics: {
    viewsThisWeek: number;
    viewsLastWeek: number;
    inquiriesThisWeek: number;
    inquiriesLastWeek: number;
    listingsActive: number;
    listingsLastWeek: number;
    conversionRate: number;
    conversionRateLastWeek: number;
  };
  topListingTitle?: string;
  className?: string;
}

export function PerformanceInsights({ metrics, topListingTitle, className }: PerformanceInsightsProps) {
  const performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Views',
      current: metrics.viewsThisWeek,
      previous: metrics.viewsLastWeek,
      icon: Eye,
    },
    {
      label: 'Inquiries',
      current: metrics.inquiriesThisWeek,
      previous: metrics.inquiriesLastWeek,
      icon: MessageSquare,
    },
    {
      label: 'Active Listings',
      current: metrics.listingsActive,
      previous: metrics.listingsLastWeek,
      icon: Home,
    },
    {
      label: 'Conversion',
      current: metrics.conversionRate,
      previous: metrics.conversionRateLastWeek,
      icon: Sparkles,
      format: 'percent',
    },
  ];

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((metric, index) => {
            const change = calculateChange(metric.current, metric.previous);
            const isPositive = change >= 0;
            const Icon = metric.icon;

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-xl bg-muted/50 border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {metric.label}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">
                    {metric.format === 'percent' 
                      ? `${metric.current.toFixed(1)}%`
                      : metric.current.toLocaleString()
                    }
                  </span>
                  <div className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    isPositive ? 'text-green-600' : 'text-red-500'
                  )}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(change)}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {topListingTitle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Top Performing Listing</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {topListingTitle}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
