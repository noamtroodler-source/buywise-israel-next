import { useState, useMemo } from 'react';
import { BarChart3, ArrowUp, ArrowDown, ArrowUpDown, MapPin, TrendingUp, TrendingDown, Minus, Search, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerFooter,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { NeighborhoodPriceRow } from '@/hooks/useNeighborhoodPriceTable';
import { PriceTier } from '@/types/neighborhood';

interface CityNeighborhoodPriceTableProps {
  cityName: string;
  rows: NeighborhoodPriceRow[];
}

type SortKey = 'name' | 'avg_price' | 'yoy_change_percent';
type SortDir = 'asc' | 'desc';

const uniformBadgeStyle = 'bg-primary/10 text-primary border-primary/20';

const priceTierLabels: Record<PriceTier, string> = {
  'budget': 'Budget-friendly',
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
  if (yoyChange == null) return <span className="text-muted-foreground">—</span>;
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

function SortIcon({ active, direction }: { active: boolean; direction: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return direction === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
}

/* ─── Inline Summary Strip ─── */
function useStripStats(rows: NeighborhoodPriceRow[]) {
  return useMemo(() => {
    if (rows.length === 0) return null;
    const prices = rows.map(r => r.avg_price).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];

    // Top riser: highest positive YoY
    const withYoy = rows.filter(r => r.yoy_change_percent != null && r.yoy_change_percent > 0);
    withYoy.sort((a, b) => (b.yoy_change_percent ?? 0) - (a.yoy_change_percent ?? 0));
    const topRiser = withYoy[0] || null;

    return { count: rows.length, min, max, topRiser };
  }, [rows]);
}

/* ─── Searchable Drawer Table ─── */
function NeighborhoodDrawerTable({ rows, cityName }: { rows: NeighborhoodPriceRow[]; cityName: string }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('avg_price');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'avg_price') cmp = a.avg_price - b.avg_price;
      else {
        cmp = (a.yoy_change_percent ?? -999) - (b.yoy_change_percent ?? -999);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, search, sortKey, sortDir]);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky search */}
      <div className="sticky top-0 z-10 bg-background px-4 pb-3 pt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search neighborhoods…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {search && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors">
                  <th
                    className="h-10 px-3 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-w-[140px]"
                    onClick={() => handleSort('name')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Neighborhood
                      <SortIcon active={sortKey === 'name'} direction={sortDir} />
                    </span>
                  </th>
                  <th
                    className="h-10 px-3 text-right align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-w-[100px]"
                    onClick={() => handleSort('avg_price')}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      Avg Price
                      <SortIcon active={sortKey === 'avg_price'} direction={sortDir} />
                    </span>
                  </th>
                  <th
                    className="h-10 px-3 text-right align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-w-[90px]"
                    onClick={() => handleSort('yoy_change_percent')}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      YoY
                      <SortIcon active={sortKey === 'yoy_change_percent'} direction={sortDir} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">
                      No neighborhoods match "{search}"
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.name} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-3 align-middle font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          {row.name}
                          {row.is_featured && (
                            <MapPin className="h-3 w-3 text-primary/60 shrink-0" />
                          )}
                        </span>
                      </td>
                      <td className="p-3 align-middle text-right font-semibold tabular-nums">
                        {formatCompactPrice(row.avg_price)}
                      </td>
                      <td className="p-3 align-middle text-right">
                        <TrendIndicator yoyChange={row.yoy_change_percent} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs text-muted-foreground text-center">
        Source: Market transaction data · 4-room apartment averages
      </div>
    </div>
  );
}

/* ─── Main Export ─── */
export function CityNeighborhoodPriceTable({ cityName, rows }: CityNeighborhoodPriceTableProps) {
  const stats = useStripStats(rows);

  if (!stats) return null;

  return (
    <section className="py-4 bg-background">
      <div className="container">
        <Drawer>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            {/* Left: stats summary */}
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <BarChart3 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground truncate">
                <span className="font-medium text-foreground">{stats.count}</span> neighborhoods
                <span className="mx-1.5">·</span>
                {formatCompactPrice(stats.min)} – {formatCompactPrice(stats.max)}
                {stats.topRiser && (
                  <>
                    <span className="mx-1.5 hidden sm:inline">·</span>
                    <span className="hidden sm:inline">
                      Top: <span className="font-medium text-foreground">{stats.topRiser.name}</span>{' '}
                      <span className="text-semantic-green">+{stats.topRiser.yoy_change_percent}%</span>
                    </span>
                  </>
                )}
              </span>
            </div>

            {/* Right: browse button */}
            <DrawerTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 text-primary hover:text-primary gap-1 text-xs font-medium">
                Browse all
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </DrawerTrigger>
          </div>

          <DrawerContent className="max-h-[75vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Neighborhoods in {cityName}</DrawerTitle>
              <DrawerDescription>
                Average 4-room apartment prices based on recent market transactions
              </DrawerDescription>
            </DrawerHeader>
            <NeighborhoodDrawerTable rows={rows} cityName={cityName} />
          </DrawerContent>
        </Drawer>
      </div>
    </section>
  );
}
