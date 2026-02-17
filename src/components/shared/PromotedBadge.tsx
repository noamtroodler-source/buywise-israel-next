import { Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PromotedBadgeProps {
  className?: string;
  /** Compact mode shows just an icon */
  compact?: boolean;
}

export function PromotedBadge({ className, compact = false }: PromotedBadgeProps) {
  return (
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
      <TooltipContent side="bottom">
        <p className="text-xs">This listing is promoted by its agent or developer</p>
      </TooltipContent>
    </Tooltip>
  );
}
