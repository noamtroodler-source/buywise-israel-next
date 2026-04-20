import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface ResultRangeProps {
  low: number;
  high: number;
  format: 'currency' | 'percent' | 'years' | 'compact';
  label: string;
  sublabel?: string;
  tooltip?: string;
  currencySymbol?: string;
  className?: string;
  variant?: 'hero' | 'stat' | 'inline';
  animate?: boolean;
}

/**
 * Formats a value according to the specified format type
 */
function formatValue(
  value: number, 
  format: 'currency' | 'percent' | 'years' | 'compact',
  currencySymbol: string = '₪'
): string {
  switch (format) {
    case 'currency':
      if (value >= 1000000) {
        return `${currencySymbol}${(value / 1000000).toFixed(1).replace('.0', '')}M`;
      }
      if (value >= 1000) {
        return `${currencySymbol}${(value / 1000).toFixed(1).replace('.0', '')}k`;
      }
      return `${currencySymbol}${Math.round(value).toLocaleString()}`;
    case 'compact':
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
      }
      return Math.round(value).toLocaleString();
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'years':
      return `${Math.round(value)}`;
    default:
      return value.toString();
  }
}

/**
 * ResultRange - Displays a min-max range consistently across calculators
 * 
 * Variants:
 * - hero: Large display for main result (e.g., monthly payment)
 * - stat: Medium display for stats grid cells
 * - inline: Compact inline display
 */
export function ResultRange({
  low,
  high,
  format,
  label,
  sublabel,
  tooltip,
  currencySymbol = '₪',
  className,
  variant = 'stat',
  animate = true,
}: ResultRangeProps) {
  const lowFormatted = formatValue(low, format, currencySymbol);
  const highFormatted = formatValue(high, format, currencySymbol);
  const isDegenerate =
    lowFormatted === highFormatted ||
    Math.abs(high - low) / Math.max(Math.abs(low), Math.abs(high), 1) < 0.02;
  const rangeText = isDegenerate ? lowFormatted : `${lowFormatted} – ${highFormatted}`;
  
  const content = (
    <div className={cn(
      variant === 'hero' && 'text-center',
      variant === 'stat' && '',
      variant === 'inline' && 'flex items-center gap-2',
      className
    )}>
      {/* Label */}
      <div className={cn(
        "flex items-center",
        variant === 'hero' && 'justify-center mb-1',
        variant === 'inline' && ''
      )}>
        <p className={cn(
          "text-muted-foreground",
          variant === 'hero' && 'text-sm',
          variant === 'stat' && 'text-xs',
          variant === 'inline' && 'text-sm'
        )}>
          {label}
        </p>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Range Value */}
      {animate ? (
        <motion.p
          key={rangeText}
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "font-semibold tracking-tight",
            variant === 'hero' && 'text-4xl md:text-5xl text-primary whitespace-nowrap',
            variant === 'stat' && 'text-lg mt-0.5',
            variant === 'inline' && 'text-base'
          )}
        >
          {rangeText}
        </motion.p>
      ) : (
        <p className={cn(
          "font-semibold tracking-tight",
          variant === 'hero' && 'text-4xl md:text-5xl text-primary whitespace-nowrap',
          variant === 'stat' && 'text-lg mt-0.5',
          variant === 'inline' && 'text-base'
        )}>
          {rangeText}
        </p>
      )}
      
      {/* Sublabel */}
      {sublabel && (
        <p className={cn(
          "text-muted-foreground",
          variant === 'hero' && 'text-xs mt-2',
          variant === 'stat' && 'text-xs mt-0.5',
          variant === 'inline' && 'text-xs'
        )}>
          {sublabel}
        </p>
      )}
    </div>
  );
  
  return content;
}

/**
 * Helper to format a single currency range string
 */
export function formatCurrencyRange(
  low: number, 
  high: number, 
  currencySymbol: string = '₪'
): string {
  const formatCompact = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return Math.round(value).toLocaleString();
  };
  
  const lowStr = `${currencySymbol}${formatCompact(low)}`;
  const highStr = `${currencySymbol}${formatCompact(high)}`;
  const isDegenerate =
    lowStr === highStr ||
    Math.abs(high - low) / Math.max(Math.abs(low), Math.abs(high), 1) < 0.02;
  return isDegenerate ? lowStr : `${lowStr} – ${highStr}`;
}

/**
 * Returns true when a low/high range collapses to effectively a single value
 * (either equal, or within 2% of each other relative to magnitude). Use this
 * to swap labels like "max budget range" → "max budget" when there is no range.
 */
export function isRangeDegenerate(low: number, high: number): boolean {
  if (low === high) return true;
  const denom = Math.max(Math.abs(low), Math.abs(high), 1);
  return Math.abs(high - low) / denom < 0.02;
}

/**
 * Helper to format a percentage range string
 */
export function formatPercentageRange(low: number, high: number): string {
  const lowStr = `${low.toFixed(1)}%`;
  const highStr = `${high.toFixed(1)}%`;
  if (lowStr === highStr) return lowStr;
  return `${lowStr} – ${highStr}`;
}
