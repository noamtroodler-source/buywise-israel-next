import { useState } from 'react';
import { Database, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MarketDataContextProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const FACTORS = [
  { label: 'Unreported payments', desc: 'Declared prices can understate actual cost.' },
  { label: 'Bundled extras', desc: 'A/C, furniture, and appliances often aren\'t in the official record.' },
  { label: 'Parking & storage', desc: 'Can be separate transactions worth ₪200K–400K.' },
  { label: 'Condition & renovation', desc: '20–30% price gap in the same building — invisible in data.' },
  { label: 'Floor & view', desc: '30–50% premium for high floors and views, not captured.' },
  { label: 'Family sales', desc: 'Below-market transfers appear as normal transactions.' },
];

export function MarketDataContext({ variant = 'compact', className }: MarketDataContextProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("flex flex-col items-center", className)}>
        <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/70 transition-colors py-1">
          <Database className="h-3 w-3" />
          <span>Official data is the best benchmark — here's what it doesn't capture.</span>
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
            {FACTORS.map((f) => (
              <p key={f.label}>
                <span className="font-medium text-foreground/70">{f.label}:</span> {f.desc}
              </p>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Full variant for city/area pages
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
        <CollapsibleTrigger className="flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors">
          <Database className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">
            Official data is a strong starting point — but doesn't capture everything
          </span>
          <ChevronDown className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-3 space-y-1.5 text-sm text-muted-foreground">
            {FACTORS.map((f) => (
              <p key={f.label}>
                <span className="font-medium text-foreground/70">{f.label}:</span> {f.desc}
              </p>
            ))}
            <p className="text-xs pt-2 border-t border-border/30">
              Recorded transactions remain the best benchmark — BuyWise helps you understand what they don't capture.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
