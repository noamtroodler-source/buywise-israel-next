import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Percent, Eye, Train, Building2, Landmark, MapPinned, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { MarketFactor } from './WorthWatchingGrid';

interface HistoricalPrice {
  year: number;
  average_price_sqm?: number | null;
}

interface CityMarketStoryProps {
  cityName: string;
  historicalPrices?: HistoricalPrice[];
  yoyChange?: number | null;
  grossYield?: number | null;
  marketFactors?: MarketFactor[];
}

const iconMap = {
  transit: Train,
  policy: Landmark,
  development: Building2,
  infrastructure: MapPinned,
  zoning: FileText,
};

export function CityMarketStory({
  cityName,
  historicalPrices = [],
  yoyChange,
  grossYield,
  marketFactors = [],
}: CityMarketStoryProps) {
  const [period, setPeriod] = useState<'5y' | '10y' | 'all'>('10y');

  // Process chart data
  const chartData = useMemo(() => {
    if (!historicalPrices || historicalPrices.length === 0) return [];

    const sorted = [...historicalPrices]
      .filter(p => p.average_price_sqm)
      .sort((a, b) => a.year - b.year);

    const currentYear = new Date().getFullYear();
    let filtered = sorted;

    if (period === '5y') {
      filtered = sorted.filter(p => p.year >= currentYear - 5);
    } else if (period === '10y') {
      filtered = sorted.filter(p => p.year >= currentYear - 10);
    }

    return filtered.map(p => ({
      year: p.year.toString(),
      price: p.average_price_sqm,
    }));
  }, [historicalPrices, period]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    if (chartData.length < 2) return null;

    const firstPrice = chartData[0]?.price || 0;
    const lastPrice = chartData[chartData.length - 1]?.price || 0;
    const years = chartData.length;

    if (firstPrice === 0) return null;

    const totalGrowth = ((lastPrice - firstPrice) / firstPrice) * 100;
    const cagr = (Math.pow(lastPrice / firstPrice, 1 / years) - 1) * 100;

    return {
      totalGrowth: totalGrowth.toFixed(0),
      cagr: cagr.toFixed(1),
      years,
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary font-semibold">
          ₪{(payload[0].value / 1000).toFixed(0)}K/m²
        </p>
      </div>
    );
  };

  const hasChartData = chartData.length > 1;
  const hasInsights = growthMetrics || yoyChange || grossYield || marketFactors.length > 0;

  if (!hasChartData && !hasInsights) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-foreground">
            Market Overview
          </h2>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart Column - Takes 2/3 */}
            {hasChartData && (
              <div className="lg:col-span-2">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    {/* Period Tabs */}
                    <div className="flex gap-1 mb-6">
                      {(['5y', '10y', 'all'] as const).map((p) => (
                        <Button
                          key={p}
                          variant={period === p ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setPeriod(p)}
                          className="text-xs"
                        >
                          {p === 'all' ? 'All Time' : p.toUpperCase()}
                        </Button>
                      ))}
                    </div>

                    {/* Chart */}
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis
                            dataKey="year"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                            className="text-muted-foreground"
                            width={50}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Insights Column - Takes 1/3 */}
            <div className={hasChartData ? 'lg:col-span-1' : 'lg:col-span-3'}>
              <Card className="border-border/50 h-full">
                <CardContent className="p-6 space-y-5">
                  <h3 className="font-semibold text-foreground">Key Insights</h3>

                  <div className="space-y-4">
                    {/* Long-term Growth */}
                    {growthMetrics && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            +{growthMetrics.totalGrowth}% over {growthMetrics.years} years
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {growthMetrics.cagr}% annual growth (CAGR)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* YoY Change */}
                    {yoyChange !== null && yoyChange !== undefined && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          {yoyChange >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-primary" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}% year-over-year
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recent price movement
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Gross Yield */}
                    {grossYield && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Percent className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {grossYield.toFixed(1)}% gross yield
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {grossYield < 3 ? 'Below national average' : grossYield > 4 ? 'Above national average' : 'Near national average'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Market Factors - "Worth Watching" */}
                    {marketFactors.slice(0, 2).map((factor, index) => {
                      const IconComponent = iconMap[factor.icon];
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Eye className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {factor.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {factor.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
