import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FeaturedNeighborhood, PriceTier } from '@/types/neighborhood';
import { cn } from '@/lib/utils';

interface CityNeighborhoodHighlightsProps {
  cityName: string;
  neighborhoods: FeaturedNeighborhood[];
}

// Uniform blue styling for all price tiers (brand-compliant)
const uniformBadgeStyle = 'bg-primary/10 text-primary border-primary/20';

const priceTierConfig: Record<PriceTier, { label: string; className: string }> = {
  'budget': { label: 'Budget-friendly', className: uniformBadgeStyle },
  'mid-range': { label: 'Mid-range', className: uniformBadgeStyle },
  'premium': { label: 'Premium', className: uniformBadgeStyle },
  'ultra-premium': { label: 'Ultra-premium', className: uniformBadgeStyle },
};

function formatCompactPrice(price: number): string {
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `₪${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `₪${Math.round(price / 1_000)}K`;
  }
  return `₪${price.toLocaleString()}`;
}

function TrendIndicator({ yoyChange }: { yoyChange: number }) {
  if (yoyChange > 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-semantic-green">
        <TrendingUp className="h-3 w-3" />
        +{yoyChange}% <span className="text-muted-foreground/60 font-normal ml-0.5">3Y</span>
      </span>
    );
  }
  if (yoyChange < -0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-destructive">
        <TrendingDown className="h-3 w-3" />
        {yoyChange}% <span className="text-muted-foreground/60 font-normal ml-0.5">3Y</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />
      Stable <span className="text-muted-foreground/60 font-normal ml-0.5">3Y</span>
    </span>
  );
}

function NeighborhoodCard({ neighborhood }: { neighborhood: FeaturedNeighborhood }) {
  const tierConfig = priceTierConfig[neighborhood.price_tier];
  const hasPrice = neighborhood.avg_price != null;
  
  return (
    <Card className="min-w-[280px] max-w-[320px] flex-shrink-0 sm:min-w-0 sm:max-w-none sm:flex-shrink border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-base leading-tight">{neighborhood.name}</h3>
            {neighborhood.name_he && (
              <p className="text-xs text-muted-foreground/70 font-normal" dir="rtl">
                {neighborhood.name_he}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm font-medium text-primary">{neighborhood.vibe}</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {neighborhood.description}
        </p>
        {hasPrice && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="text-sm">
              <span className="text-muted-foreground">Avg. </span>
              <span className="font-semibold text-foreground">
                {formatCompactPrice(neighborhood.avg_price!)}
              </span>
            </div>
            {neighborhood.yoy_change_percent != null && (
              <TrendIndicator yoyChange={neighborhood.yoy_change_percent} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CityNeighborhoodHighlights({ cityName, neighborhoods }: CityNeighborhoodHighlightsProps) {
  if (!neighborhoods || neighborhoods.length === 0) {
    return null;
  }

  const useGrid = neighborhoods.length >= 4;

  return (
    <section className="py-10 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Neighborhoods in {cityName}
          </h2>
        </div>

        {/* Cards Layout */}
        {useGrid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {neighborhoods.map((neighborhood) => (
              <NeighborhoodCard key={neighborhood.name} neighborhood={neighborhood} />
            ))}
          </div>
        ) : (
          <>
            <div className="sm:hidden">
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {neighborhoods.map((neighborhood) => (
                    <NeighborhoodCard key={neighborhood.name} neighborhood={neighborhood} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {neighborhoods.map((neighborhood) => (
                <NeighborhoodCard key={neighborhood.name} neighborhood={neighborhood} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
