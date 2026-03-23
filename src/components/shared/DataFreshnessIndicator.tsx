import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DataFreshnessIndicatorProps {
  lastReviewed: string | null;
  isStale: boolean;
  isDueSoon: boolean;
  label: string;
  className?: string;
  showLabel?: boolean;
}

export function DataFreshnessIndicator({
  lastReviewed,
  isStale,
  isDueSoon,
  label,
  className,
  showLabel = false,
}: DataFreshnessIndicatorProps) {
  const formattedDate = lastReviewed
    ? new Date(lastReviewed).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Unknown';

  const Icon = isStale ? AlertTriangle : isDueSoon ? Clock : CheckCircle2;
  const colorClass = isStale
    ? 'text-destructive'
    : isDueSoon
    ? 'text-amber-500'
    : 'text-muted-foreground';

  const tooltipText = isStale
    ? `${label}: Review overdue — last verified ${formattedDate}`
    : isDueSoon
    ? `${label}: Review due soon — last verified ${formattedDate}`
    : `${label}: Data as of ${formattedDate}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center gap-1 text-xs', colorClass, className)}>
          <Icon className="h-3 w-3" />
          {showLabel && <span>{formattedDate}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[250px]">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

interface MultiFreshnessProps {
  items: Array<{
    lastReviewed: string | null;
    isStale: boolean;
    isDueSoon: boolean;
    label: string;
    category: string;
  }>;
  className?: string;
}

export function MultiFreshnessIndicator({ items, className }: MultiFreshnessProps) {
  if (items.length === 0) return null;

  const hasStale = items.some(i => i.isStale);
  const hasDueSoon = items.some(i => i.isDueSoon);

  // Find the oldest review date
  const oldestDate = items
    .filter(i => i.lastReviewed)
    .sort((a, b) => new Date(a.lastReviewed!).getTime() - new Date(b.lastReviewed!).getTime())[0];

  const formattedDate = oldestDate?.lastReviewed
    ? new Date(oldestDate.lastReviewed).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  const Icon = hasStale ? AlertTriangle : hasDueSoon ? Clock : CheckCircle2;
  const colorClass = hasStale
    ? 'text-destructive'
    : hasDueSoon
    ? 'text-amber-500'
    : 'text-muted-foreground';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center gap-1 text-xs', colorClass, className)}>
          <Icon className="h-3 w-3" />
          {formattedDate && <span>Data as of {formattedDate}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[300px]">
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.category} className="flex items-center gap-1.5">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                item.isStale ? 'bg-destructive' : item.isDueSoon ? 'bg-amber-500' : 'bg-primary/60'
              )} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
