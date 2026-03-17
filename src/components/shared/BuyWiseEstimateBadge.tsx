import { Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFormatPrice } from '@/contexts/PreferencesContext';

interface BuyWiseEstimateBadgeProps {
  rental4RoomMin?: number | null;
  rental4RoomMax?: number | null;
  medianPrice?: number | null;
  sources?: string;
  verifiedAt?: string | null;
}

export function BuyWiseEstimateBadge({
  rental4RoomMin,
  rental4RoomMax,
  medianPrice,
  sources,
  verifiedAt,
}: BuyWiseEstimateBadgeProps) {
  const formatPrice = useFormatPrice();

  const hasMethodology = rental4RoomMin && rental4RoomMax && medianPrice;

  const formatVerifiedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const tooltipContent = hasMethodology
    ? `Calculated from avg 4-room rent ${formatPrice(rental4RoomMin, 'ILS')}–${formatPrice(rental4RoomMax, 'ILS')}/mo ÷ median purchase price ${formatPrice(medianPrice, 'ILS')}.${sources ? ` Sources: ${sources}.` : ''}${verifiedAt ? ` Verified ${formatVerifiedDate(verifiedAt)}.` : ''}`
    : `BuyWise editorial estimate based on market research.${sources ? ` Sources: ${sources}.` : ''}${verifiedAt ? ` Verified ${formatVerifiedDate(verifiedAt)}.` : ''}`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 cursor-help whitespace-nowrap">
            <Lightbulb className="h-3 w-3" />
            BuyWise Estimate
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
