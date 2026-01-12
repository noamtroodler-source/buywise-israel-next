import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface ToolDisclaimerProps {
  text?: string;
  variant?: 'mortgage' | 'affordability' | 'investment' | 'costs' | 'comparison' | 'renovation' | 'default';
  className?: string;
}

/**
 * Context-specific disclaimer text for each calculator type
 */
export const DISCLAIMER_VARIANTS = {
  mortgage: 
    "Estimates shown as ranges to reflect rate and term variance. Get 3+ bank quotes for actual costs. " +
    "Consult a licensed mortgage advisor (יועץ משכנתאות) for personalized advice.",
  affordability: 
    "Max budget depends on current rates and individual bank criteria. A 1% rate change can shift your maximum by ~₪300k. " +
    "Banks may apply additional income discounts based on your specific situation.",
  investment: 
    "Projections assume stable rent, appreciation, and vacancy rates. Actual returns will vary based on market conditions, " +
    "tenant quality, and expense fluctuations. Past performance doesn't guarantee future results.",
  costs: 
    "Fee ranges reflect typical 2024-2025 Israeli market rates. Lawyer and agent fees are negotiable. " +
    "Get itemized quotes for your specific transaction.",
  comparison: 
    "This comparison depends heavily on appreciation, rate, and rent increase assumptions. Small changes in these assumptions " +
    "can significantly affect the outcome. Consider both scenarios before deciding.",
  renovation:
    "Cost ranges reflect 2024-2025 Israeli contractor rates. Actual costs vary by location, contractor, and scope. " +
    "Get 3+ detailed quotes and use the 30/40/30 payment schedule.",
  default: 
    "This calculator provides estimates for informational purposes only. Actual costs may vary. " +
    "Consult with a licensed professional for personalized advice.",
} as const;

export function ToolDisclaimer({ 
  text, 
  variant = 'default',
  className 
}: ToolDisclaimerProps) {
  const disclaimerText = text || DISCLAIMER_VARIANTS[variant];
  
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground",
      className
    )}>
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <p>{disclaimerText}</p>
    </div>
  );
}
