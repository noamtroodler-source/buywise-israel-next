import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insights: string[];
  className?: string;
}

export function InsightCard({ insights, className }: InsightCardProps) {
  if (!insights.length) return null;

  return (
    <div className={cn("border-l-2 border-primary/20 pl-4 space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          BuyWise Take
        </p>
      </div>
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <p key={index} className="text-sm text-foreground/80 leading-relaxed">
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
}
