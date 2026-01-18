import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  href: string;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
}

export function AdminStatsCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
  trendLabel,
  subtitle,
}: AdminStatsCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return Minus;
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-all hover:border-primary/30 group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(value)}</p>
              {trend !== undefined && (
                <div className="flex items-center gap-1">
                  <TrendIcon className={cn(
                    "h-3 w-3",
                    trend > 0 ? "text-primary" : trend < 0 ? "text-muted-foreground" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    trend > 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                  {trendLabel && (
                    <span className="text-xs text-muted-foreground">{trendLabel}</span>
                  )}
                </div>
              )}
              {subtitle && !trend && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
