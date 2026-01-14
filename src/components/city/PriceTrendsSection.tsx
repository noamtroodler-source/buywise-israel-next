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
import { HistoricalPrice, calculateCAGR, useHistoricalPriceComparison } from '@/hooks/useHistoricalPrices';
import { CityComparisonSelector } from './CityComparisonSelector';
import { CityAppreciationExplorer } from './CityAppreciationExplorer';
import { useCities } from '@/hooks/useCities';
import { useCityComparison } from '@/hooks/useMarketData';
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

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NATIONAL_AVG_YIELD = 2.8;

// Brand colors: Distinct hues in cool-tone family for clear chart differentiation
const LINE_COLORS = [
  'hsl(var(--primary))',        // Primary city: brand blue
  'hsl(190, 80%, 42%)',         // 2nd city: teal/cyan
  'hsl(258, 55%, 52%)',         // 3rd city: indigo/purple
];

export function PriceTrendsSection({ 
  marketData, 
  cityName, 
  canonicalMetrics, 
  historicalPrices = [],
  yoyChange,
  dataSources,
  lastVerified
}: PriceTrendsSectionProps) {
  const [selectedCities, setSelectedCities] = useState<string[]>([cityName]);
  
  // Determine if we have enough historical data for "All Time" view
  const earliestYear = historicalPrices.length > 0 
    ? Math.min(...historicalPrices.map(p => p.year)) 
    : new Date().getFullYear();
  const hasLimitedHistory = historicalPrices.length < 4;
  
  // Default to '1y', but ensure we don't default to 'all' if limited history
  const [period, setPeriod] = useState<'6m' | '1y' | 'all'>('1y');

  const { data: allCities = [] } = useCities();
  const { data: comparisonData = [] } = useCityComparison(selectedCities);
  const { data: historicalComparisonData = [] } = useHistoricalPriceComparison(selectedCities);

  const availableCities = useMemo(() => {
    return allCities.map((c) => ({ name: c.name, slug: c.slug }));
  }, [allCities]);

  // Process monthly chart data for short-term views (6m, 1y)
  const monthlyChartData = useMemo(() => {
    // If only one city and it's the current city, use the prop data
    if (selectedCities.length === 1 && selectedCities[0] === cityName) {
      const monthly = marketData
        .filter((d) => d.data_type === 'monthly' && d.month != null)
        .sort((a, b) => {
          const ak = `${a.year}-${String(a.month).padStart(2, '0')}`;
          const bk = `${b.year}-${String(b.month).padStart(2, '0')}`;
          return ak.localeCompare(bk);
        });

      return monthly.map((d) => ({
        name: `${months[(d.month || 1) - 1]} ${d.year}`,
        [cityName]: d.average_price_sqm || 0,
      }));
    }

    // Multiple cities - use comparison data
    const dateMap = new Map<string, Record<string, number>>();

    comparisonData.forEach((d) => {
      if (d.month == null) return;
      const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
      const existing = dateMap.get(key) || {};
      existing[d.city] = d.average_price_sqm || 0;
      dateMap.set(key, existing);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => {
        const [year, month] = key.split('-');
        return {
          name: `${months[parseInt(month) - 1]} ${year}`,
          ...values,
        };
      });
  }, [marketData, comparisonData, selectedCities, cityName]);

  // Process yearly chart data for "All Time" view using historical_prices
  const yearlyChartData = useMemo(() => {
    // Use comparison data if multiple cities selected, otherwise use prop data
    const dataSource = selectedCities.length > 1 ? historicalComparisonData : historicalPrices;
    
    if (!dataSource.length) return [];
    
    // Average apartment size in sqm for estimating price/sqm where missing
    const AVG_APARTMENT_SIZE = 90;
    
    // Group by year and merge city data
    const yearMap = new Map<number, Record<string, number>>();
    
    dataSource.forEach(p => {
      if (!p.average_price && !p.average_price_sqm) return;
      
      const pricePerSqm = p.average_price_sqm || Math.round((p.average_price || 0) / AVG_APARTMENT_SIZE);
      if (pricePerSqm <= 0) return;
      
      const existing = yearMap.get(p.year) || {};
      existing[p.city] = pricePerSqm;
      yearMap.set(p.year, existing);
    });
    
    return Array.from(yearMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, values]) => ({
        name: String(year),
        ...values,
      }));
  }, [historicalPrices, historicalComparisonData, selectedCities]);

  const filteredData = useMemo(() => {
    if (period === 'all') {
      // Use yearly historical data for "All Time" view
      return yearlyChartData;
    }
    // Use monthly data for short-term views
    if (period === '6m') return monthlyChartData.slice(-6);
    return monthlyChartData.slice(-12); // 1y
  }, [monthlyChartData, yearlyChartData, period]);

  // Calculate 10-year growth (for current city only)
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

  // Custom tooltip for multi-city comparison
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.stroke }}
              />
              <span className="text-sm text-muted-foreground">{entry.dataKey}:</span>
              <span className="text-sm font-semibold" style={{ color: entry.stroke }}>
                ₪{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}/m²
              </span>
            </div>
          ))}
        </div>
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
    
    if (grossYield !== null) {
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
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Price Trends</h2>
              <p className="text-muted-foreground mt-1">
                {selectedCities.length > 1 
                  ? 'Compare how markets have moved over time'
                  : `How ${cityName}'s market has moved over time`}
              </p>
            </div>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="bg-background">
                <TabsTrigger value="6m" className="text-xs">6 Months</TabsTrigger>
                <TabsTrigger value="1y" className="text-xs">1 Year</TabsTrigger>
                {!hasLimitedHistory && (
                  <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* City Comparison Selector */}
          <CityComparisonSelector
            currentCity={cityName}
            selectedCities={selectedCities}
            onCitiesChange={setSelectedCities}
            availableCities={availableCities}
          />

          {/* Key Metrics */}
          <div className="flex flex-wrap gap-6 text-sm">
            {growthMetrics && (
              <div className="bg-background rounded-lg px-4 py-2 border border-border/50">
                <span className="font-semibold text-foreground">+{growthMetrics.totalAppreciation}%</span>
                <span className="text-muted-foreground ml-1.5">{growthMetrics.years}-year growth</span>
              </div>
            )}
            {priceChange !== null && (
              <div className="bg-background rounded-lg px-4 py-2 border border-border/50">
                <span className="font-semibold text-foreground">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1.5">this year</span>
              </div>
            )}
            {grossYield !== null && (
              <div className="bg-background rounded-lg px-4 py-2 border border-border/50">
                <span className="font-semibold text-foreground">{grossYield.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1.5">gross yield</span>
              </div>
            )}
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
                {selectedCities.map((city, index) => (
                  <Line
                    key={city}
                    type="monotone"
                    dataKey={city}
                    stroke={LINE_COLORS[index] || LINE_COLORS[0]}
                    strokeWidth={2.5}
                    dot={{ fill: LINE_COLORS[index] || LINE_COLORS[0], strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* What If Widget - Compact inline */}
          {historicalPrices.length > 1 && (
            <CityAppreciationExplorer 
              cityName={cityName}
              historicalPrices={historicalPrices}
            />
          )}

          {/* Source Attribution - below chart */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <InlineSourceBadge 
              sources={dataSources} 
              lastVerified={lastVerified}
              variant="subtle"
            />
            {hasLimitedHistory && (
              <span className="text-xs text-muted-foreground italic">
                Historical data available from {earliestYear}
              </span>
            )}
          </div>

          {/* Insight */}
          <div className="flex gap-3 p-4 rounded-xl bg-background border border-border/50">
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