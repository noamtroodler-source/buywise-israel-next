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
  Legend,
} from 'recharts';
import { InlineSourceBadge } from '@/components/shared/InlineSourceBadge';
import { useHistoricalPrices, calculateCAGR } from '@/hooks/useHistoricalPrices';
import { useNationalAveragePrices } from '@/hooks/useNationalAveragePrices';
import { useFormatPrice } from '@/contexts/PreferencesContext';

interface HistoricalPriceChartProps {
  citySlug: string;
  cityName: string;
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
}

type Period = '5y' | '10y' | 'all';

function formatAbbrev(value: number): string {
  if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₪${(value / 1_000).toFixed(0)}K`;
  return `₪${value}`;
}

export function HistoricalPriceChart({
  citySlug,
  cityName,
  dataSources,
  lastVerified,
}: HistoricalPriceChartProps) {
  const [period, setPeriod] = useState<Period>('10y');
  const { data: cityPrices = [] } = useHistoricalPrices(citySlug);
  const { data: nationalAvg = [] } = useNationalAveragePrices();
  const formatPrice = useFormatPrice();

  // Merge city + national data by year
  const mergedData = useMemo(() => {
    const nationalMap = new Map(nationalAvg.map((n) => [n.year, n.avg_price]));

    return cityPrices
      .filter((p) => p.average_price && p.average_price > 0)
      .map((p) => ({
        year: p.year,
        city: p.average_price!,
        national: nationalMap.get(p.year) ?? null,
        yoy: p.yoy_change_percent,
        notes: p.notes,
      }))
      .sort((a, b) => a.year - b.year);
  }, [cityPrices, nationalAvg]);

  // Filter by period
  const filteredData = useMemo(() => {
    if (mergedData.length === 0) return [];
    const currentYear = new Date().getFullYear();
    if (period === '5y') return mergedData.filter((d) => d.year >= currentYear - 5);
    if (period === '10y') return mergedData.filter((d) => d.year >= currentYear - 10);
    return mergedData;
  }, [mergedData, period]);

  // Calculate metrics for selected period
  const metrics = useMemo(() => {
    if (filteredData.length < 2) return null;
    const first = filteredData[0];
    const last = filteredData[filteredData.length - 1];
    const years = last.year - first.year;
    if (years <= 0) return null;

    const totalAppreciation = ((last.city - first.city) / first.city) * 100;
    const cagr = calculateCAGR(first.city, last.city, years);
    const latestYoY = last.yoy;

    // National CAGR for comparison
    let nationalCagr: number | null = null;
    if (first.national && last.national && first.national > 0) {
      nationalCagr = calculateCAGR(first.national, last.national, years);
    }

    // Delta vs national
    let deltaVsNational: number | null = null;
    if (last.national && last.national > 0) {
      deltaVsNational = ((last.city - last.national) / last.national) * 100;
    }

    return {
      totalAppreciation: Math.round(totalAppreciation),
      cagr,
      latestYoY,
      years,
      nationalCagr,
      deltaVsNational: deltaVsNational !== null ? Math.round(deltaVsNational) : null,
    };
  }, [filteredData]);

  // Generate insight text
  const insight = useMemo(() => {
    if (!metrics) return null;
    const parts: string[] = [];

    if (metrics.deltaVsNational !== null) {
      const dir = metrics.deltaVsNational > 0 ? 'above' : 'below';
      parts.push(
        `${cityName} prices are ${Math.abs(metrics.deltaVsNational)}% ${dir} the national average.`
      );
    }

    parts.push(
      `Over the past ${metrics.years} years, the city has grown ${metrics.cagr}% annually`
    );
    if (metrics.nationalCagr !== null) {
      parts[parts.length - 1] += ` vs ${metrics.nationalCagr}% nationally.`;
    } else {
      parts[parts.length - 1] += '.';
    }

    if (metrics.latestYoY !== null && metrics.latestYoY !== undefined) {
      if (metrics.latestYoY > 5) {
        parts.push(`The market is currently accelerating at +${metrics.latestYoY.toFixed(1)}% year-over-year.`);
      } else if (metrics.latestYoY > 0) {
        parts.push(`Recent growth is steady at +${metrics.latestYoY.toFixed(1)}% year-over-year.`);
      } else if (metrics.latestYoY < -2) {
        parts.push(`Prices have softened ${metrics.latestYoY.toFixed(1)}% from the previous year.`);
      }
    }

    return parts.join(' ');
  }, [metrics, cityName]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const cityVal = payload.find((p: any) => p.dataKey === 'city')?.value;
    const natVal = payload.find((p: any) => p.dataKey === 'national')?.value;
    const item = filteredData.find((d) => d.year === label);

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-[240px]">
        <p className="font-semibold text-foreground text-sm mb-1.5">{label}</p>
        {cityVal != null && (
          <p className="text-primary font-medium text-sm">
            {cityName}: {formatAbbrev(cityVal)}
          </p>
        )}
        {natVal != null && (
          <p className="text-muted-foreground text-sm">
            National Avg: {formatAbbrev(natVal)}
          </p>
        )}
        {item?.yoy != null && (
          <p className="text-xs text-muted-foreground mt-1">
            YoY: {item.yoy > 0 ? '+' : ''}{item.yoy.toFixed(1)}%
          </p>
        )}
        {item?.notes && (
          <p className="text-xs text-muted-foreground mt-1 italic border-t border-border/50 pt-1">
            {item.notes.length > 80 ? item.notes.slice(0, 80) + '…' : item.notes}
          </p>
        )}
      </div>
    );
  };

  // Determine year range for subtitle
  const yearRange = filteredData.length >= 2
    ? `${filteredData[0].year}–${filteredData[filteredData.length - 1].year}`
    : '';

  if (filteredData.length < 2) return null;

  return (
    <section className="py-16 bg-muted/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Price History
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                How {cityName} prices have moved over time
              </p>
            </div>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="bg-background">
                <TabsTrigger value="5y" className="text-xs">5 Years</TabsTrigger>
                <TabsTrigger value="10y" className="text-xs">10 Years</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Key Metrics */}
          {metrics && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="font-semibold text-foreground">
                  {metrics.totalAppreciation > 0 ? '+' : ''}{metrics.totalAppreciation}%
                </span>
                <span className="text-muted-foreground ml-1">total ({metrics.years}yr)</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{metrics.cagr}%</span>
                <span className="text-muted-foreground ml-1">annual (CAGR)</span>
              </div>
              {metrics.latestYoY != null && (
                <div>
                  <span className="font-semibold text-foreground">
                    {metrics.latestYoY > 0 ? '+' : ''}{metrics.latestYoY.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">last year</span>
                </div>
              )}
              {metrics.deltaVsNational != null && (
                <div>
                  <span className="font-semibold text-foreground">
                    {metrics.deltaVsNational > 0 ? '+' : ''}{metrics.deltaVsNational}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs national</span>
                </div>
              )}
            </div>
          )}

          {/* Chart */}
          <div className="h-[280px] w-full bg-background rounded-xl border border-border/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  axisLine={{ className: 'stroke-border' }}
                  tickLine={{ className: 'stroke-border' }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => formatAbbrev(v)}
                  axisLine={{ className: 'stroke-border' }}
                  tickLine={{ className: 'stroke-border' }}
                  width={65}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={28}
                  iconType="plainline"
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line
                  name={cityName}
                  type="monotone"
                  dataKey="city"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  name="National Avg"
                  type="monotone"
                  dataKey="national"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          {insight && (
            <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">What this means: </span>
                {insight}
              </p>
            </div>
          )}

          {/* Source attribution */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <InlineSourceBadge
                sources={{ CBS: 'Central Bureau of Statistics' }}
                lastVerified={lastVerified}
              />
              <span className="text-xs text-muted-foreground">
                Yearly Data · {yearRange}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
