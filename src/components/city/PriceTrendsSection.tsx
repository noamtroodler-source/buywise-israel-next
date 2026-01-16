import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MarketData } from '@/types/projects';
import { CanonicalMetrics } from '@/hooks/useCanonicalMetrics';
import { HistoricalPrice } from '@/hooks/useHistoricalPrices';
import { InlineSourceBadge } from '@/components/shared/InlineSourceBadge';

interface PriceTrendsSectionProps {
  marketData: MarketData[];
  cityName: string;
  canonicalMetrics?: CanonicalMetrics | null;
  historicalPrices?: HistoricalPrice[];
  yoyChange?: number | null;
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
}

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

export function PriceTrendsSection({ 
  marketData, 
  cityName, 
  canonicalMetrics, 
  historicalPrices = [],
  yoyChange,
  dataSources,
  lastVerified
}: PriceTrendsSectionProps) {
  // Determine if we have enough historical data for "All Time" view
  const earliestYear = historicalPrices.length > 0 
    ? Math.min(...historicalPrices.map(p => p.year)) 
    : new Date().getFullYear();
  const hasLimitedHistory = historicalPrices.length < 8 || earliestYear > 2017;
  
  // Determine if we have quarterly data at all
  const hasQuarterlyData = useMemo(() => {
    return marketData.some(d => d.data_type === 'quarterly' && d.month != null);
  }, [marketData]);

  // Default to 'all' if no quarterly data, otherwise '1y'
  const [period, setPeriod] = useState<'1y' | '5y' | 'all'>('1y');

  // Determine if we have enough quarterly data for 5Y view (require 12+ quarters = 3 years)
  const hasSufficient5YData = useMemo(() => {
    const quarterlyPoints = marketData.filter(d => d.data_type === 'quarterly' && d.month != null);
    return quarterlyPoints.length >= 12;
  }, [marketData]);

  // Get earliest quarterly data date for transparency note
  const earliestQuarterlyDate = useMemo(() => {
    const quarterly = marketData
      .filter(d => d.data_type === 'quarterly' && d.month != null)
      .sort((a, b) => {
        const ak = `${a.year}-${String(a.month).padStart(2, '0')}`;
        const bk = `${b.year}-${String(b.month).padStart(2, '0')}`;
        return ak.localeCompare(bk);
      });
    if (quarterly.length === 0) return null;
    const first = quarterly[0];
    return `${quarters[(first.month || 1) - 1]} ${first.year}`;
  }, [marketData]);

  // Auto-switch to 'all' if no quarterly data available, or reset if tab becomes unavailable
  useEffect(() => {
    if (!hasQuarterlyData && historicalPrices.length > 0) {
      setPeriod('all');
    } else if (period === '5y' && !hasSufficient5YData) {
      setPeriod('1y');
    } else if (period === 'all' && hasLimitedHistory) {
      setPeriod('1y');
    }
  }, [hasQuarterlyData, hasSufficient5YData, hasLimitedHistory, historicalPrices.length, period]);

  // Process quarterly chart data for short-term views (1y, 5y) - single city only (no comparison)
  const quarterlyChartData = useMemo(() => {
    const quarterly = marketData
      .filter((d) => d.data_type === 'quarterly' && d.month != null)
      .sort((a, b) => {
        const ak = `${a.year}-${String(a.month).padStart(2, '0')}`;
        const bk = `${b.year}-${String(b.month).padStart(2, '0')}`;
        return ak.localeCompare(bk);
      });

    return quarterly.map((d) => ({
      name: `${quarters[(d.month || 1) - 1]} ${d.year}`,
      price: d.average_price_sqm || 0,
    }));
  }, [marketData]);

  // Process yearly chart data for "All Time" view using historical_prices - single city only
  const yearlyChartData = useMemo(() => {
    if (!historicalPrices.length) return [];
    
    // Average apartment size in sqm for estimating price/sqm where missing
    const AVG_APARTMENT_SIZE = 90;
    
    return historicalPrices
      .filter(p => p.average_price || p.average_price_sqm)
      .map(p => {
        const pricePerSqm = p.average_price_sqm || Math.round((p.average_price || 0) / AVG_APARTMENT_SIZE);
        return {
          name: String(p.year),
          price: pricePerSqm,
        };
      })
      .filter(d => d.price > 0)
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [historicalPrices]);

  const filteredData = useMemo(() => {
    if (period === 'all') {
      // Use yearly historical data for "All Time" view
      return yearlyChartData;
    }
    // Use quarterly data for short-term views
    if (period === '5y') return quarterlyChartData.slice(-20); // 5 years = 20 quarters
    return quarterlyChartData.slice(-4); // 1y = 4 quarters
  }, [quarterlyChartData, yearlyChartData, period]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground text-sm mb-1">{label}</p>
        <span className="text-sm font-semibold text-primary">
          ₪{typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}/m²
        </span>
      </div>
    );
  };

  // Only hide if we have NO data from any source
  const hasAnyData = quarterlyChartData.length > 0 || yearlyChartData.length > 0;
  if (!hasAnyData) return null;

  return (
    <section className="py-16 bg-muted/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header with Period Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Broader Market Conditions</h2>
              <p className="text-muted-foreground mt-1">
                Regional price movement over time
              </p>
            </div>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="bg-background">
                {hasQuarterlyData && (
                  <TabsTrigger value="1y" className="text-xs">1 Year</TabsTrigger>
                )}
                {hasQuarterlyData && hasSufficient5YData && (
                  <TabsTrigger value="5y" className="text-xs">5 Years</TabsTrigger>
                )}
                {!hasLimitedHistory && (
                  <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Explanatory Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border/50 text-sm">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground leading-relaxed">
              Israel's Central Bureau of Statistics publishes price indices at the regional level, not per city. 
              This chart shows verified regional trends as background context for your research — use it to understand 
              the broader market environment, not to predict specific city performance.
            </p>
          </div>

          {/* Chart */}
          <div className="h-[280px] w-full bg-background rounded-xl border border-border/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  axisLine={{ className: 'stroke-border' }}
                  tickLine={{ className: 'stroke-border' }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                  axisLine={{ className: 'stroke-border' }}
                  tickLine={{ className: 'stroke-border' }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Source Attribution - below chart */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <InlineSourceBadge 
                sources={dataSources} 
                lastVerified={lastVerified}
                variant="subtle"
              />
              {period !== 'all' && hasQuarterlyData && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  CBS Regional Index
                </span>
              )}
              {!hasQuarterlyData && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Yearly regional data
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground italic">
              {hasLimitedHistory && (
                <span>Data available from {earliestYear}</span>
              )}
              {!hasSufficient5YData && earliestQuarterlyDate && (
                <span>Quarterly data from {earliestQuarterlyDate}</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
