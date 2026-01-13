import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
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
import { HistoricalPrice, calculateCAGR } from '@/hooks/useHistoricalPrices';

interface CityMarketRealityProps {
  marketData: MarketData[];
  cityName: string;
  canonicalMetrics?: CanonicalMetrics | null;
  historicalPrices?: HistoricalPrice[];
  yoyChange?: number | null;
  yieldMin?: number | null;
  yieldMax?: number | null;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NATIONAL_AVG_YIELD = 2.8;

export function CityMarketReality({ 
  marketData, 
  cityName, 
  canonicalMetrics, 
  historicalPrices = [],
  yoyChange,
  yieldMin,
  yieldMax
}: CityMarketRealityProps) {
  const [period, setPeriod] = useState<'6m' | '1y' | 'all'>('1y');

  const monthly = useMemo(() => {
    return marketData
      .filter((d) => d.data_type === 'monthly' && d.month != null)
      .sort((a, b) => {
        const ak = `${a.year}-${String(a.month).padStart(2, '0')}`;
        const bk = `${b.year}-${String(b.month).padStart(2, '0')}`;
        return ak.localeCompare(bk);
      });
  }, [marketData]);

  const chartData = useMemo(() => {
    return monthly.map((d) => ({
      name: `${months[(d.month || 1) - 1]} ${d.year}`,
      value: d.average_price_sqm || 0,
    }));
  }, [monthly]);

  const filteredData = useMemo(() => {
    if (period === '6m') return chartData.slice(-6);
    if (period === '1y') return chartData.slice(-12);
    return chartData;
  }, [chartData, period]);

  // Calculate 10-year growth
  const growthMetrics = useMemo(() => {
    if (historicalPrices.length < 2) return null;
    
    const sortedPrices = [...historicalPrices].sort((a, b) => a.year - b.year);
    const firstValidPrice = sortedPrices.find(p => p.average_price_sqm && p.average_price_sqm > 0);
    const lastValidPrice = sortedPrices.reverse().find(p => p.average_price_sqm && p.average_price_sqm > 0);
    
    if (!firstValidPrice || !lastValidPrice || firstValidPrice.year === lastValidPrice.year) return null;
    
    const startPrice = firstValidPrice.average_price_sqm!;
    const endPrice = lastValidPrice.average_price_sqm!;
    const years = lastValidPrice.year - firstValidPrice.year;
    
    const totalAppreciation = ((endPrice - startPrice) / startPrice) * 100;
    const cagr = calculateCAGR(startPrice, endPrice, years);
    
    return {
      totalAppreciation: Math.round(totalAppreciation),
      cagr,
      years,
    };
  }, [historicalPrices]);

  const grossYield = canonicalMetrics?.gross_yield_percent ?? null;
  const priceChange = yoyChange ?? canonicalMetrics?.yoy_price_change ?? null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const v = payload?.[0]?.value;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground text-sm mb-1">{label}</p>
        <p className="text-primary font-semibold">₪{typeof v === 'number' ? v.toLocaleString() : v}/m²</p>
      </div>
    );
  };

  // Generate insight text
  const generateInsight = () => {
    const parts: string[] = [];
    
    if (growthMetrics) {
      parts.push(`Over the past ${growthMetrics.years} years, ${cityName} has seen +${growthMetrics.totalAppreciation}% total appreciation (${growthMetrics.cagr}% annually).`);
    }
    
    if (priceChange !== null) {
      if (priceChange > 5) {
        parts.push(`The market is currently heating up with ${priceChange.toFixed(1)}% year-over-year growth.`);
      } else if (priceChange > 0) {
        parts.push(`Prices are showing steady growth at ${priceChange.toFixed(1)}% year-over-year.`);
      } else if (priceChange < -2) {
        parts.push(`The market is cooling with prices down ${Math.abs(priceChange).toFixed(1)}% from last year.`);
      } else {
        parts.push(`Prices are holding steady compared to last year.`);
      }
    }
    
    if (yieldMin && yieldMax) {
      const avgYield = (yieldMin + yieldMax) / 2;
      if (avgYield >= NATIONAL_AVG_YIELD) {
        parts.push(`Rental yields of ${yieldMin.toFixed(1)}%–${yieldMax.toFixed(1)}% are above the national average, making this attractive for investors.`);
      } else {
        parts.push(`Rental yields of ${yieldMin.toFixed(1)}%–${yieldMax.toFixed(1)}% are typical for an appreciation-focused market.`);
      }
    } else if (grossYield !== null) {
      if (grossYield >= NATIONAL_AVG_YIELD) {
        parts.push(`Rental yields of ${grossYield.toFixed(1)}% are above the national average, making this attractive for investors.`);
      } else {
        parts.push(`Rental yields of ${grossYield.toFixed(1)}% are typical for an appreciation-focused market.`);
      }
    }
    
    return parts.join(' ') || `${cityName} has shown consistent market activity over the tracked period.`;
  };

  if (filteredData.length === 0) return null;

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
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Market Reality
            </h2>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="bg-background">
                <TabsTrigger value="6m" className="text-xs">6 Months</TabsTrigger>
                <TabsTrigger value="1y" className="text-xs">1 Year</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Key Metrics Inline */}
          <div className="flex flex-wrap gap-6 text-sm">
            {growthMetrics && (
              <div>
                <span className="font-semibold text-foreground">+{growthMetrics.totalAppreciation}%</span>
                <span className="text-muted-foreground ml-1">{growthMetrics.years}-year growth</span>
              </div>
            )}
            {priceChange !== null && (
              <div>
                <span className="font-semibold text-foreground">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1">this year</span>
              </div>
            )}
            {/* Show yield range if available, otherwise single value */}
            {yieldMin && yieldMax ? (
              <div>
                <span className="font-semibold text-foreground">{yieldMin.toFixed(1)}%–{yieldMax.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1">gross yield range</span>
              </div>
            ) : grossYield !== null && (
              <div>
                <span className="font-semibold text-foreground">{grossYield.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1">gross yield</span>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-[260px] w-full bg-background rounded-xl border border-border/50 p-4">
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
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insight Paragraph */}
          <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">What this means: </span>
              {generateInsight()}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
