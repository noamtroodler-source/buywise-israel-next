import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface LTVIndicatorProps {
  ltv: number;
  maxLTV: number;
  className?: string;
}

export function LTVIndicator({ ltv, maxLTV, className }: LTVIndicatorProps) {
  const getStatus = () => {
    const ratio = ltv / maxLTV;
    if (ratio < 0.7) return { label: 'Excellent', variant: 'success' as const };
    if (ratio < 0.85) return { label: 'Good', variant: 'success' as const };
    if (ratio < 0.95) return { label: 'Moderate', variant: 'warning' as const };
    return { label: 'At Limit', variant: 'danger' as const };
  };

  const status = getStatus();

  const variantStyles = {
    success: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-muted text-muted-foreground border-border',
    danger: 'bg-muted text-foreground border-border',
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">LTV Ratio</span>
          <span className="text-sm font-semibold">{ltv.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              status.variant === 'success' && "bg-primary",
              status.variant === 'warning' && "bg-primary/60",
              status.variant === 'danger' && "bg-muted-foreground"
            )}
            style={{ width: `${Math.min(ltv / maxLTV * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Max allowed: {maxLTV}%</p>
      </div>
      <Badge variant="outline" className={cn("shrink-0", variantStyles[status.variant])}>
        {status.label}
      </Badge>
    </div>
  );
}
