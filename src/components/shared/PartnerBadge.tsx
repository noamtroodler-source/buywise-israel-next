import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PartnerBadgeProps {
  className?: string;
  /** compact = icon only (for card overlays). full = icon + text (for contact sidebar) */
  compact?: boolean;
}

/**
 * Shown on listings that are directly listed by a BuyWise Partner Agency.
 * Signals to buyers that contact is direct, information is verified, and
 * the agency is part of the BuyWise network.
 */
export function PartnerBadge({ className, compact = false }: PartnerBadgeProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'bg-primary/10 text-primary border-primary/25 text-[10px] font-semibold gap-0.5',
              className
            )}
          >
            <ShieldCheck className="h-3 w-3 flex-shrink-0" />
            {!compact && <span>BuyWise Partner</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="z-[60] max-w-[180px]">
          <p className="text-xs font-medium">BuyWise Partner Agency</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified agency — direct contact, accurate listing info.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
