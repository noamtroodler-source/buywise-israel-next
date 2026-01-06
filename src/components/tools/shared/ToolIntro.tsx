import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

interface ToolIntroProps {
  /** The anxiety or question this tool addresses */
  problem: string;
  /** What this tool can answer */
  canDo: string;
  /** What this tool cannot answer (optional) */
  cannotDo?: string;
  className?: string;
}

/**
 * A "Why This Tool Exists" intro block that appears above calculators.
 * Explains what anxiety the tool reduces and sets expectations.
 */
export function ToolIntro({ problem, canDo, cannotDo, className }: ToolIntroProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border/50 mb-6",
      className
    )}>
      <div className="p-1.5 rounded-md bg-primary/10 shrink-0 mt-0.5">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          <span className="font-medium text-foreground">{problem}</span>
          {' '}{canDo}
        </p>
        {cannotDo && (
          <p className="text-xs opacity-80">{cannotDo}</p>
        )}
      </div>
    </div>
  );
}

// Pre-defined intros for each calculator
export const TOOL_INTROS = {
  mortgage: {
    problem: "Wondering if you can afford the monthly payments?",
    canDo: "This tool shows you exactly what a mortgage costs in Israel — including the limits banks actually apply to foreign buyers.",
    cannotDo: "It can't tell you which tracks to choose (that's for your advisor), but it will show you whether the numbers work."
  },
  affordability: {
    problem: "Not sure how much you can actually borrow?",
    canDo: "Banks in Israel apply strict rules that limit what you can borrow. This tool shows your real maximum — not a fantasy number — based on Bank of Israel regulations for your buyer type.",
  },
  trueCost: {
    problem: "The listing price is just the beginning.",
    canDo: "This calculator shows every cost you'll actually pay — from Mas Rechisha (purchase tax) to lawyer fees to moving costs — so there are no surprises.",
  },
  rentVsBuy: {
    problem: "Torn between renting and buying?",
    canDo: "This calculator factors in Israeli-specific costs like Mas Shevach (capital gains tax) and Arnona to show you when buying actually wins.",
    cannotDo: "Most generic calculators miss these entirely."
  },
  investment: {
    problem: "Is this property actually a good investment?",
    canDo: "This tool calculates your true returns — including purchase costs, ongoing expenses, and Israeli exit taxes — so you can compare properties objectively.",
  },
  renovation: {
    problem: "Planning a renovation and need a budget?",
    canDo: "Get realistic cost estimates for Israeli renovation projects, from basic updates to full gut renovations, with local pricing data.",
  },
} as const;
