import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PriceContextBadgeProps {
  status?: string | null;
  publicLabel?: string | null;
  confidenceTier?: string | null;
  className?: string;
}

export function PriceContextBadge({ status, publicLabel, confidenceTier, className }: PriceContextBadgeProps) {
  const isComplete = status === 'complete';
  const isBlocked = status === 'blocked';
  const Icon = isComplete ? CheckCircle2 : isBlocked ? AlertTriangle : HelpCircle;
  const label = isComplete ? 'Price Context complete' : isBlocked ? 'Context under review' : 'Needs price context';
  const detail = publicLabel
    ? `${publicLabel}${confidenceTier ? ` • ${confidenceTier.replace(/_/g, ' ')}` : ''}`
    : isComplete
      ? 'Buyer-facing pricing context is ready.'
      : 'Add SQM source, ownership type, and premium explanation if needed.';

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'w-fit gap-1 text-xs',
              isComplete
                ? 'border-semantic-green/40 bg-semantic-green/10 text-semantic-green'
                : isBlocked
                  ? 'border-semantic-amber/40 bg-semantic-amber/10 text-semantic-amber'
                  : 'border-border bg-muted/50 text-muted-foreground',
              className,
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{detail}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}