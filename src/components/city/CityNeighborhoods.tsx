import { useState, useMemo } from 'react';
import { MapPin, Search, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  anglo_tag?: boolean;
}

interface CityNeighborhoodsProps {
  cityName: string;
  neighborhoods: UnifiedNeighborhood[];
}

const PAGE_SIZE = 6;

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

function NeighborhoodCard({ n }: { n: UnifiedNeighborhood }) {
  const hasPrice = n.avg_price != null;

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-muted/40',
        n.is_featured && 'border-l-2 border-l-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{n.name}</h3>
          {n.name_he && (
            <span className="text-[11px] text-muted-foreground/60 shrink-0" dir="rtl">
              {n.name_he}
            </span>
          )}
        </div>
        {n.anglo_tag && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary/70 bg-primary/8 border border-primary/15 rounded-full px-1.5 py-0.5 shrink-0 whitespace-nowrap">
            Anglo hub
          </span>
        )}
      </div>

      {n.is_featured && n.vibe && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {n.vibe}
        </p>
      )}

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
  const [currentPage, setCurrentPage] = useState(0);

  const isSearching = search.trim().length > 0;

  type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'growth_asc' | 'growth_desc';
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = neighborhoods;
    if (q === 'anglo') {
      result = neighborhoods.filter(n => n.anglo_tag);
    } else if (q) {
      result = neighborhoods.filter(n =>
        n.name.toLowerCase().includes(q) ||
        (n.name_he && n.name_he.includes(q))
      );
    }

    if (sortBy === 'featured') return result;

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.avg_price ?? Infinity) - (b.avg_price ?? Infinity);
        case 'price_desc':
          return (b.avg_price ?? -Infinity) - (a.avg_price ?? -Infinity);
        case 'growth_desc':
          return (b.yoy_change_percent ?? -Infinity) - (a.yoy_change_percent ?? -Infinity);
        case 'growth_asc':
          return (a.yoy_change_percent ?? Infinity) - (b.yoy_change_percent ?? Infinity);
        default:
          return 0;
      }
    });
  }, [neighborhoods, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages - 1, 0));

  const displayed = isSearching
    ? filtered
    : filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  if (neighborhoods.length === 0) return null;

  return (
    <section className="py-10 bg-muted/30">
      <div className="container">
        {/* Header row */}
        <div className="flex flex-col gap-3 mb-5">
          {/* Top: Title + Pagination + Search */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Title */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <h2 className="text-lg font-semibold truncate">
                Neighborhoods in {cityName}
              </h2>
              <span className="text-xs text-muted-foreground shrink-0">
                ({neighborhoods.length})
              </span>
            </div>

            {/* Right: Pagination arrows + Search */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Pagination (hidden during search) */}
              {!isSearching && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary disabled:opacity-30"
                    disabled={safePage === 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    aria-label="Previous neighborhoods"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums min-w-[2rem] text-center">
                    {safePage + 1}/{totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary disabled:opacity-30"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    aria-label="Next neighborhoods"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Search */}
              <div className="relative w-48 sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search neighborhoods…"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search result count */}
        {isSearching && (
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

        {/* Source note */}
        <p className="text-[11px] text-muted-foreground/60 mt-4 text-center">
          Prices: CBS (Central Bureau of Statistics) · 4-room avg · 3-year trend
        </p>
      </div>
    </section>
  );
}
