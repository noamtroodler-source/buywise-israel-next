import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SampleSizeWarningProps {
  sampleSize: number;
  className?: string;
  showLabel?: boolean;
}

type Reliability = 'reliable' | 'limited' | 'insufficient';

function getReliability(sampleSize: number): Reliability {
  if (sampleSize >= 100) return 'reliable';
  if (sampleSize >= 30) return 'limited';
  return 'insufficient';
}

const reliabilityConfig: Record<Reliability, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  label: string;
  tooltip: string;
}> = {
  reliable: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    label: 'Reliable',
    tooltip: 'Sample size ≥100: Statistically significant data',
  },
  limited: {
    icon: Info,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    label: 'Limited',
    tooltip: 'Sample size 30-99: Results may have higher variance',
  },
  insufficient: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    label: 'Insufficient',
    tooltip: 'Sample size <30: Not statistically significant - interpret with caution',
  },
};

export function SampleSizeWarning({ sampleSize, className, showLabel = false }: SampleSizeWarningProps) {
  const reliability = getReliability(sampleSize);
  const config = reliabilityConfig[reliability];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-help',
            config.bgColor,
            config.color,
            className
          )}>
            <Icon className="h-3 w-3" />
            {showLabel ? (
              <span>{config.label}</span>
            ) : (
              <span>n={sampleSize.toLocaleString()}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{config.label} Data</p>
          <p className="text-xs text-muted-foreground mt-1">
            {config.tooltip}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sample size: {sampleSize.toLocaleString()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SampleSizeIndicator({ sampleSize }: { sampleSize: number }) {
  const reliability = getReliability(sampleSize);
  const config = reliabilityConfig[reliability];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs',
      config.color
    )}>
      <Icon className="h-3.5 w-3.5" />
      <span>Based on {sampleSize.toLocaleString()} samples</span>
    </div>
  );
}
