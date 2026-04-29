/**
 * SpecBasedComps
 *
 * Replaces RecentNearbySales for listings with no coordinates.
 * Shows "What similar properties sold for in [city/neighborhood]"
 * — giving buyers honest market context even without an address.
 *
 * Displayed inside MarketIntelligence when latitude/longitude are missing.
 */

import { TrendingUp, TrendingDown, Minus, BarChart3, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useFormatPrice, useFormatPricePerArea } from '@/contexts/PreferencesContext';
import { useSpecBasedSoldComps, computeSpecCompStats, SpecBasedComp } from '@/hooks/useSpecBasedSoldComps';

interface SpecBasedCompsProps {
  city: string;
  neighborhood?: string | null;
  bedrooms?: number | null;
  sizeSqm?: number | null;
  price?: number;
  currency?: string;
  sourceRooms?: number | null; // Israeli room count from scraping
  subjectProperty?: Parameters<typeof useSpecBasedSoldComps>[5];
  onVerdictComputed?: Parameters<typeof import('./RecentNearbySales').RecentNearbySales>[0]['onVerdictComputed'];
  className?: string;
}

function CompRow({ comp, subjectPriceSqm }: { comp: SpecBasedComp; subjectPriceSqm?: number | null }) {
  const formatPrice = useFormatPrice();
  const formatPricePerArea = useFormatPricePerArea();

  const vsSubject =
    subjectPriceSqm && comp.price_per_sqm
      ? ((subjectPriceSqm - comp.price_per_sqm) / comp.price_per_sqm) * 100
      : null;

  const locationLabel = comp.neighborhood || null;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(comp.sold_price, 'ILS')}
          </span>
          {comp.price_per_sqm && (
            <span className="text-xs text-muted-foreground">
              · {formatPricePerArea(comp.price_per_sqm)}/m²
            </span>
          )}
          {vsSubject !== null && (
            <Badge
              className={cn(
                'text-xs h-5 px-1.5',
                vsSubject > 5
                  ? 'bg-semantic-green/10 text-semantic-green border-semantic-green/20'
                  : vsSubject < -5
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {vsSubject > 0 ? (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              ) : vsSubject < 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <Minus className="w-3 h-3 mr-0.5" />
              )}
              {Math.abs(Math.round(vsSubject))}%{' '}
              {vsSubject > 0 ? 'cheaper' : vsSubject < 0 ? 'pricier' : 'similar'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {comp.rooms && <span>{comp.rooms}R</span>}
          {comp.size_sqm && <span>{comp.size_sqm}m²</span>}
          {locationLabel && <span>· {locationLabel}</span>}
          <span>· {format(new Date(comp.sold_date), 'MMM yyyy')}</span>
        </div>
      </div>
    </div>
  );
}

export function SpecBasedComps({
  city,
  neighborhood,
  bedrooms,
  sizeSqm,
  price,
  currency = 'ILS',
  sourceRooms,
  subjectProperty,
  onVerdictComputed,
  className,
}: SpecBasedCompsProps) {
  const { data: comps = [], isLoading } = useSpecBasedSoldComps(
    city,
    bedrooms,
    sizeSqm,
    neighborhood,
    sourceRooms,
    subjectProperty
  );

  const subjectPriceSqm = price && sizeSqm && sizeSqm > 0 ? price / sizeSqm : null;
  const stats = computeSpecCompStats(comps, subjectPriceSqm);

  if (onVerdictComputed && stats) {
    // Keep no-address listings wired into the parent Price Context verdict.
    onVerdictComputed(stats.vsSubjectPct, stats.count, 1000, stats.avgPriceSqm, stats.dispersionPercent, null, null, null);
  }

  const locationLabel = neighborhood ? `${neighborhood}, ${city}` : city;

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (comps.length === 0) {
    return (
      <div className={cn('rounded-xl bg-muted/40 p-4 text-center text-sm text-muted-foreground', className)}>
        No recent comparable sales found in {locationLabel}.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Similar sales in {locationLabel}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Government-recorded sales of similar properties ({bedrooms != null ? `${bedrooms + 1} rooms` : 'similar size'}).
              Shown because this listing has no exact address — these comps give you a market sense for the area.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Summary stats bar */}
      {stats && stats.count >= 2 && (
        <div className="rounded-xl bg-muted/40 px-4 py-3 grid grid-cols-3 gap-2 text-center border border-border/30">
          <div>
            <p className="text-xs text-muted-foreground">Avg ₪/m²</p>
            <p className="text-sm font-bold text-foreground">
              ₪{stats.avgPriceSqm.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Range</p>
            <p className="text-sm font-bold text-foreground">
              ₪{Math.round(stats.minPriceSqm / 1000)}K–{Math.round(stats.maxPriceSqm / 1000)}K
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sales found</p>
            <p className="text-sm font-bold text-foreground">{stats.count}</p>
          </div>
        </div>
      )}

      {/* Subject property price vs comps */}
      {stats?.vsSubjectPct !== null && subjectPriceSqm && (
        <div className={cn(
          'rounded-lg px-3 py-2 flex items-center gap-2 text-sm',
          (stats.vsSubjectPct ?? 0) > 10 ? 'bg-semantic-green/10 text-semantic-green' :
          (stats.vsSubjectPct ?? 0) < -10 ? 'bg-destructive/10 text-destructive' :
          'bg-muted/60 text-muted-foreground'
        )}>
          {(stats.vsSubjectPct ?? 0) > 0
            ? <TrendingDown className="w-4 h-4 flex-shrink-0" />
            : (stats.vsSubjectPct ?? 0) < 0
            ? <TrendingUp className="w-4 h-4 flex-shrink-0" />
            : <Minus className="w-4 h-4 flex-shrink-0" />}
          <span>
            This listing is asking{' '}
            <strong>{Math.abs(stats.vsSubjectPct ?? 0)}%{' '}
            {(stats.vsSubjectPct ?? 0) > 0 ? 'below' : (stats.vsSubjectPct ?? 0) < 0 ? 'above' : 'in line with'}</strong>{' '}
            recent comparable sales.
          </span>
        </div>
      )}

      {/* Comp rows */}
      <div className="divide-y divide-border/30">
        {comps.map((comp) => (
          <CompRow key={comp.id} comp={comp} subjectPriceSqm={subjectPriceSqm} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Based on government-recorded transactions · Last 18 months · Approximate specs match
      </p>
    </div>
  );
}
