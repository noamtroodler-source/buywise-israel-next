import { Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PromotedBadgeProps {
  className?: string;
  /** Compact mode shows just an icon */
  compact?: boolean;
}

export function PromotedBadge({ className, compact = false }: PromotedBadgeProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-medium ${className ?? ''}`}
          >
            <Megaphone className="h-3 w-3 mr-0.5" />
            {!compact && 'Promoted'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="z-[60]">
          <p className="text-xs">Promoted listing</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
