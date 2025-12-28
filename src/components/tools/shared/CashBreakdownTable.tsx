import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BreakdownItem {
  label: string;
  value: string;
  percentage?: string;
  tooltip?: string;
  isSeparator?: boolean;
  isTotal?: boolean;
  highlight?: 'positive' | 'negative' | 'neutral';
}

interface CashBreakdownTableProps {
  title?: string;
  items: BreakdownItem[];
  className?: string;
}

export function CashBreakdownTable({ title, items, className }: CashBreakdownTableProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {title && (
        <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="space-y-2">
        {items.map((item, index) => {
          if (item.isSeparator) {
            return <div key={index} className="border-t border-border my-2" />;
          }

          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between py-1",
                item.isTotal && "pt-2 border-t border-border"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-sm",
                    item.isTotal ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
                {item.percentage && (
                  <span className="text-xs text-muted-foreground">({item.percentage})</span>
                )}
                {item.tooltip && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {item.tooltip}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  item.isTotal && "text-lg font-bold text-foreground",
                  item.highlight === 'positive' && "text-success",
                  item.highlight === 'negative' && "text-destructive"
                )}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
