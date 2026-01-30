import { motion } from 'framer-motion';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Property } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface ComparisonRow {
  label: string;
  getValue: (property: Property) => string;
  icon?: LucideIcon;
  tooltip?: string;
  highlight?: boolean;
  getBestPropertyId?: (properties: Property[]) => string | null;
}

interface CompareSectionProps {
  title: string;
  icon: LucideIcon;
  rows: ComparisonRow[];
  properties: Property[];
  variant?: 'default' | 'investor';
}

export function CompareSection({ 
  title, 
  icon: Icon, 
  rows, 
  properties,
  variant = 'default'
}: CompareSectionProps) {
  const isMobile = useIsMobile();
  
  const bgClass = variant === 'investor' 
    ? 'bg-gradient-to-br from-primary/5 to-primary/10' 
    : 'bg-card';
  
  const headerBgClass = variant === 'investor'
    ? 'bg-primary/10'
    : 'bg-muted/50';

  // Get property display name (works for both Property and Project types)
  const getPropertyName = (property: any): string => {
    return property.title || property.name || 'Property';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-border overflow-hidden ${bgClass}`}
    >
      {/* Section Header */}
      <div className={`px-4 py-3 flex items-center gap-2 ${headerBgClass}`}>
        <Icon className={`h-4 w-4 ${variant === 'investor' ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="font-semibold text-sm">{title}</span>
      </div>

      {/* Mobile: Stacked vertical layout per metric */}
      {isMobile ? (
        <div className="divide-y divide-border">
          {rows.map((row, rowIndex) => {
            const bestPropertyId = row.getBestPropertyId?.(properties);
            
            return (
              <div key={row.label} className="py-3 px-4 space-y-2">
                {/* Metric Label */}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {row.icon && <row.icon className="h-4 w-4 shrink-0" />}
                  <span>{row.label}</span>
                  {row.tooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{row.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                {/* Property Values - Stacked cards */}
                <div className="space-y-1.5">
                  {properties.map(property => {
                    const isBest = bestPropertyId === property.id;
                    const value = row.getValue(property);
                    
                    return (
                      <div 
                        key={property.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2",
                          isBest 
                            ? "bg-primary/10 border border-primary/20" 
                            : "bg-muted/30"
                        )}
                      >
                        <span className={cn(
                          "text-sm truncate max-w-[50%]",
                          isBest && "font-medium"
                        )}>
                          {getPropertyName(property)}
                        </span>
                        <span className={cn(
                          "text-sm font-semibold text-right",
                          row.highlight && "text-primary",
                          isBest && !row.highlight && "text-primary"
                        )}>
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: Original CSS Grid table layout */
        <div className="divide-y divide-border">
          {rows.map((row, rowIndex) => {
            const bestPropertyId = row.getBestPropertyId?.(properties);
            
            return (
              <div 
                key={row.label}
                className={`grid gap-4 ${rowIndex % 2 === 0 ? 'bg-muted/20' : ''}`}
                style={{ 
                  gridTemplateColumns: `minmax(120px, 160px) repeat(${properties.length}, minmax(0, 1fr))` 
                }}
              >
                {/* Row Label */}
                <div className="px-4 py-3 font-medium text-sm flex items-center gap-2">
                  {row.icon && <row.icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="truncate">{row.label}</span>
                  {row.tooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{row.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Property Values */}
                {properties.map(property => {
                  const isBest = bestPropertyId === property.id;
                  const value = row.getValue(property);
                  
                  return (
                    <div 
                      key={property.id}
                      className={`px-4 py-3 text-sm flex items-center gap-2 ${
                        row.highlight ? 'font-semibold text-primary' : ''
                      } ${isBest ? 'relative' : ''}`}
                    >
                      {isBest && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
                      )}
                      <span className={isBest && !row.highlight ? 'font-medium text-primary' : ''}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
