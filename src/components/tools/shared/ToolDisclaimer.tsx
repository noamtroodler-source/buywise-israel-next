import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface ToolDisclaimerProps {
  text?: string;
  className?: string;
}

const DEFAULT_DISCLAIMER = 
  "This calculator provides estimates for informational purposes only. Actual costs may vary. " +
  "Consult with a licensed mortgage advisor or financial professional for personalized advice.";

export function ToolDisclaimer({ text = DEFAULT_DISCLAIMER, className }: ToolDisclaimerProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground",
      className
    )}>
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <p>{text}</p>
    </div>
  );
}
