import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Percent, ChartLine, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

interface CityNumbersNarrativeProps {
  marketData: MarketData[];
  cityName: string;
  canonicalMetrics?: CanonicalMetrics | null;
  historicalPrices?: HistoricalPrice[];
  yoyChange?: number | null;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NATIONAL_AVG_YIELD = 2.8;

export function CityNumbersNarrative({ 
  marketData, 
  cityName, 
  canonicalMetrics, 
  historicalPrices = [],
  yoyChange 
}: CityNumbersNarrativeProps) {
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

  const insightCards = [
    {
      icon: ChartLine,
      value: growthMetrics ? `+${growthMetrics.totalAppreciation}%` : 'N/A',
      label: growthMetrics ? `${growthMetrics.years}-Year Growth` : 'Long-Term Growth',
      sublabel: growthMetrics ? `${growthMetrics.cagr}% annual average` : 'Historical appreciation',
      tooltip: 'Total price appreciation over the past decade, with CAGR showing yearly average.',
    },
    {
      icon: TrendingUp,
      value: priceChange !== null ? `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%` : 'Stable',
      label: 'Year-over-Year',
      sublabel: priceChange !== null && priceChange > 0 ? 'Prices rising' : priceChange !== null && priceChange < 0 ? 'Prices cooling' : 'Stable market',
      tooltip: 'Price change compared to the same period last year.',
    },
    {
      icon: Percent,
      value: grossYield !== null ? `${grossYield.toFixed(1)}%` : 'N/A',
      label: 'Gross Yield',
      sublabel: grossYield !== null 
        ? `${grossYield >= NATIONAL_AVG_YIELD ? 'Above' : 'Below'} ${NATIONAL_AVG_YIELD}% avg`
        : 'Annual rental return',
      tooltip: 'Annual rental income as percentage of property value. Higher = better immediate returns.',
    },
  ];

  return (
    <TooltipProvider>
      <section className="py-12 bg-muted/40">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ChartLine className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">What The Numbers Say</h2>
            </div>

            {/* Chart */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg font-medium text-foreground">
                    Price Trend in {cityName}
                  </CardTitle>
                  <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                    <TabsList className="bg-muted">
                      <TabsTrigger value="6m" className="text-xs">6M</TabsTrigger>
                      <TabsTrigger value="1y" className="text-xs">1Y</TabsTrigger>
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                          axisLine={{ className: 'stroke-border' }}
                          tickLine={{ className: 'stroke-border' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
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
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No price trend data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insightCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="border-border/50 bg-background hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <card.icon className="h-4 w-4 text-primary" />
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-xs">
                            {card.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-2xl font-bold text-foreground mb-1">{card.value}</p>
                      <p className="text-sm font-medium text-foreground/80">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.sublabel}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </TooltipProvider>
  );
}
