import { useState, useMemo } from 'react';
import { MapPin, Search, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PriceTier } from '@/types/neighborhood';

export interface UnifiedNeighborhood {
  name: string;
  name_he?: string;
  vibe?: string;
  description?: string;
  price_tier: PriceTier | null;
  avg_price: number | null;
  yoy_change_percent: number | null;
  is_featured: boolean;
  sort_order?: number;
}

interface CityNeighborhoodsProps {
  cityName: string;
  neighborhoods: UnifiedNeighborhood[];
}

const INITIAL_SHOW = 8;

const uniformBadgeStyle = 'bg-primary/10 text-primary border-primary/20';

const priceTierLabels: Record<PriceTier, string> = {
  'budget': 'Budget',
  'mid-range': 'Mid-range',
  'premium': 'Premium',
  'ultra-premium': 'Ultra-premium',
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

function TrendIndicator({ yoyChange }: { yoyChange: number | null }) {
  if (yoyChange == null) return null;
  if (yoyChange > 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-semantic-green">
        <TrendingUp className="h-3 w-3" />
        +{yoyChange}%
      </span>
    );
  }
  if (yoyChange < -0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-destructive">
        <TrendingDown className="h-3 w-3" />
        {yoyChange}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />
      Stable
    </span>
  );
}

function NeighborhoodCard({ n }: { n: UnifiedNeighborhood }) {
  const hasPrice = n.avg_price != null;

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-muted/40',
        n.is_featured && 'border-l-2 border-l-primary/30'
      )}
    >
      {/* Row 1: Name + Hebrew + Tier badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{n.name}</h3>
          {n.name_he && (
            <span className="text-[11px] text-muted-foreground/60 shrink-0" dir="rtl">
              {n.name_he}
            </span>
          )}
        </div>
        {n.price_tier && (
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 h-5 whitespace-nowrap shrink-0', uniformBadgeStyle)}
          >
            {priceTierLabels[n.price_tier]}
          </Badge>
        )}
      </div>

      {/* Row 2: Vibe (featured only) */}
      {n.is_featured && n.vibe && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {n.vibe}
        </p>
      )}

      {/* Row 3: Price + Trend */}
      {hasPrice && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold tabular-nums">
            {formatCompactPrice(n.avg_price!)}
          </span>
          <TrendIndicator yoyChange={n.yoy_change_percent} />
        </div>
      )}
    </div>
  );
}

export function CityNeighborhoods({ cityName, neighborhoods }: CityNeighborhoodsProps) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return neighborhoods;
    return neighborhoods.filter(n =>
      n.name.toLowerCase().includes(q) ||
      (n.name_he && n.name_he.includes(q))
    );
  }, [neighborhoods, search]);

  const displayed = showAll || search ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = !search && !showAll && filtered.length > INITIAL_SHOW;

  if (neighborhoods.length === 0) return null;

  return (
    <section className="py-10 bg-muted/30">
      <div className="container">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Neighborhoods in {cityName}
            </h2>
            <span className="text-xs text-muted-foreground">
              ({neighborhoods.length})
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search neighborhoods…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Search result count */}
        {search && (
          <p className="text-xs text-muted-foreground mb-3">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Card grid */}
        {displayed.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No neighborhoods match "{search}"
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayed.map(n => (
              <NeighborhoodCard key={n.name} n={n} />
            ))}
          </div>
        )}

        {/* Show all button */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-primary hover:text-primary gap-1 text-xs font-medium"
            >
              Show all {neighborhoods.length} neighborhoods
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Source note */}
        <p className="text-[11px] text-muted-foreground/60 mt-4 text-center">
          Prices: CBS (Central Bureau of Statistics) · 4-room apartment averages
        </p>
      </div>
    </section>
  );
}
