import { useState, useMemo } from 'react';
import { BarChart3, ArrowUp, ArrowDown, ArrowUpDown, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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

export function CityNeighborhoodPriceTable({ cityName, rows }: CityNeighborhoodPriceTableProps) {
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

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === 'avg_price') {
        cmp = a.avg_price - b.avg_price;
      } else {
        const aVal = a.yoy_change_percent ?? -999;
        const bVal = b.yoy_change_percent ?? -999;
        cmp = aVal - bVal;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  if (rows.length === 0) return null;

  // Determine data period from first row
  const period = rows[0] ? `Q${rows[0].latest_quarter} ${rows[0].latest_year}` : '';

  return (
    <section className="py-10 bg-background">
      <div className="container">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Neighborhood Prices in {cityName}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Average 4-room apartment prices based on recent transactions
            {period && <span className="ml-1">· {period}</span>}
          </p>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors">
                  <th
                    className="h-11 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors sticky left-0 bg-muted/30 z-10 min-w-[160px]"
                    onClick={() => handleSort('name')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Neighborhood
                      <SortIcon active={sortKey === 'name'} direction={sortDir} />
                    </span>
                  </th>
                  <th
                    className="h-11 px-4 text-right align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-w-[130px]"
                    onClick={() => handleSort('avg_price')}
                  >
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      Avg Price
                      <SortIcon active={sortKey === 'avg_price'} direction={sortDir} />
                    </span>
                  </th>
                  <th
                    className="h-11 px-4 text-right align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-w-[110px]"
                    onClick={() => handleSort('yoy_change_percent')}
                  >
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      YoY Change
                      <SortIcon active={sortKey === 'yoy_change_percent'} direction={sortDir} />
                    </span>
                  </th>
                  <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground min-w-[120px]">
                    Price Tier
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {sorted.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle sticky left-0 bg-background z-10 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {row.name}
                        {row.is_featured && (
                          <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                        )}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right font-semibold tabular-nums">
                      {formatCompactPrice(row.avg_price)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <TrendIndicator yoyChange={row.yoy_change_percent} />
                    </td>
                    <td className="p-4 align-middle">
                      {row.price_tier ? (
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0 h-5 whitespace-nowrap', uniformBadgeStyle)}
                        >
                          {priceTierLabels[row.price_tier]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {rows.length} neighborhood{rows.length !== 1 ? 's' : ''} with price data
          </span>
          <span>Source: CBS (Central Bureau of Statistics)</span>
        </div>
      </div>
    </section>
  );
}
