import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { InlineSourceBadge } from '@/components/shared/InlineSourceBadge';
import { InfoBanner } from '@/components/tools/shared/InfoBanner';
import { useHistoricalPrices, useHistoricalPriceComparison, calculateCAGR } from '@/hooks/useHistoricalPrices';
import { useNationalAveragePrices } from '@/hooks/useNationalAveragePrices';
import { useCities } from '@/hooks/useCities';
import { CityComparisonSelector } from './CityComparisonSelector';
import { cn } from '@/lib/utils';
import { getCityInsight } from './cityInsights';

interface HistoricalPriceChartProps {
  citySlug: string;
  cityName: string;
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
}

type Period = '5y' | '10y' | 'all';

const COMPARE_COLORS = ['#1FA3A3', '#6366F1'];

function formatAbbrev(value: number): string {
  if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₪${(value / 1_000).toFixed(0)}K`;
  return `₪${value.toLocaleString()}`;
}

function metricColor(value: number): string {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

function formatSigned(value: number, decimals = 1): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(decimals)}%`;
}

function normalizeCityName(name: string): string {
  return name.replace(/['']/g, '');
}

export function HistoricalPriceChart({
  citySlug,
  cityName,
  dataSources,
  lastVerified,
}: HistoricalPriceChartProps) {
  const [period, setPeriod] = useState<Period>('10y');
  const [compareCities, setCompareCities] = useState<string[]>([cityName]);
  const { data: cityPrices = [] } = useHistoricalPrices(citySlug);
  const { data: nationalAvg = [] } = useNationalAveragePrices();
  const { data: allCities = [] } = useCities();

  // Get comparison city names (excluding current)
  const comparisonCityNames = compareCities.filter((c) => c !== cityName);
  const { data: comparisonData = [] } = useHistoricalPriceComparison(comparisonCityNames);

  const isComparing = comparisonCityNames.length > 0;

  // Available cities for selector
  const availableCities = useMemo(
    () => allCities.map((c) => ({ name: c.name, slug: c.slug })),
    [allCities],
  );

  // Merge city + national data by year
  const mergedData = useMemo(() => {
    const nationalMap = new Map(nationalAvg.map((n) => [n.year, n.avg_price]));
    const sorted = cityPrices
      .filter((p) => p.average_price && p.average_price > 0)
      .sort((a, b) => a.year - b.year);

    // Group comparison data by city+year
    const compMap = new Map<string, number>();
    for (const row of comparisonData) {
      if (row.average_price) {
        compMap.set(`${row.city}-${row.year}`, row.average_price);
      }
    }

    return sorted.map((p, i) => {
      const prevPrice = i > 0 ? sorted[i - 1].average_price : null;
      const computedYoY =
        prevPrice && prevPrice > 0
          ? Math.round(((p.average_price! - prevPrice) / prevPrice) * 1000) / 10
          : null;

      const point: Record<string, any> = {
        year: p.year,
        city: p.average_price!,
        national: nationalMap.get(p.year) ?? null,
        yoy: computedYoY,
        notes: p.notes,
      };

      // Add comparison city data
      comparisonCityNames.forEach((name, idx) => {
        const normalized = normalizeCityName(name);
        point[`compare${idx}`] = compMap.get(`${normalized}-${p.year}`) ?? null;
      });

      return point;
    });
  }, [cityPrices, nationalAvg, comparisonData, comparisonCityNames]);

  // Filter by period
  const filteredData = useMemo(() => {
    if (mergedData.length === 0) return [];
    const currentYear = new Date().getFullYear();
    if (period === '5y') return mergedData.filter((d) => d.year >= currentYear - 5);
    if (period === '10y') return mergedData.filter((d) => d.year >= currentYear - 10);
    return mergedData;
  }, [mergedData, period]);

  // Metrics for current city only
  const metrics = useMemo(() => {
    if (filteredData.length < 2) return null;
    const first = filteredData[0];
    const last = filteredData[filteredData.length - 1];
    const years = last.year - first.year;
    if (years <= 0) return null;

    const totalAppreciation = ((last.city - first.city) / first.city) * 100;
    const cagr = calculateCAGR(first.city, last.city, years);
    const latestYoY = last.yoy;

    let nationalCagr: number | null = null;
    if (first.national && last.national && first.national > 0) {
      nationalCagr = calculateCAGR(first.national, last.national, years);
    }

    let deltaVsNational: number | null = null;
    if (last.national && last.national > 0) {
      deltaVsNational = ((last.city - last.national) / last.national) * 100;
    }

    const peak = filteredData.reduce((max, d) => (d.city > max.city ? d : max), filteredData[0]);

    return {
      totalAppreciation: Math.round(totalAppreciation * 10) / 10,
      cagr,
      latestYoY,
      years,
      nationalCagr,
      deltaVsNational: deltaVsNational !== null ? Math.round(deltaVsNational) : null,
      peakYear: peak.year,
      peakPrice: peak.city,
      currentPrice: last.city,
    };
  }, [filteredData]);

  // Insight text
  const insight = useMemo(() => {
    if (!metrics) return null;
    const parts: string[] = [];
    if (metrics.deltaVsNational !== null) {
      const dir = metrics.deltaVsNational > 0 ? 'above' : 'below';
      parts.push(`${cityName} prices are ${Math.abs(metrics.deltaVsNational)}% ${dir} the national average.`);
    }
    if (metrics.totalAppreciation > 0) {
      parts.push(
        `Over ${metrics.years} years, prices rose ${metrics.totalAppreciation.toFixed(0)}% total (${metrics.cagr}% annually${metrics.nationalCagr !== null ? ` vs ${metrics.nationalCagr}% nationally` : ''}).`,
      );
    } else {
      parts.push(`Over this ${metrics.years}-year window, prices declined ${Math.abs(metrics.totalAppreciation).toFixed(0)}%.`);
      if (metrics.peakYear && metrics.currentPrice < metrics.peakPrice) {
        const fromPeak = (((metrics.peakPrice - metrics.currentPrice) / metrics.peakPrice) * 100).toFixed(0);
        parts.push(`Prices peaked in ${metrics.peakYear} at ${formatAbbrev(metrics.peakPrice)} and are currently ${fromPeak}% below that peak.`);
      }
    }
    if (metrics.latestYoY != null) {
      if (metrics.latestYoY > 5) parts.push(`The market is currently accelerating at +${metrics.latestYoY.toFixed(1)}% year-over-year.`);
      else if (metrics.latestYoY > 0) parts.push(`Recent growth is steady at +${metrics.latestYoY.toFixed(1)}% year-over-year.`);
      else if (metrics.latestYoY < -5) parts.push(`The market is in a correction phase, with prices down ${Math.abs(metrics.latestYoY).toFixed(1)}% from the previous year.`);
      else if (metrics.latestYoY < 0) parts.push(`Prices have softened ${Math.abs(metrics.latestYoY).toFixed(1)}% from the previous year.`);
    }
    return parts.join(' ');
  }, [metrics, cityName]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const cityVal = payload.find((p: any) => p.dataKey === 'city')?.value;
    const natVal = payload.find((p: any) => p.dataKey === 'national')?.value;
    const item = filteredData.find((d) => d.year === label);
    const delta = cityVal && natVal ? ((cityVal - natVal) / natVal) * 100 : null;

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
        <p className="font-semibold text-foreground text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {cityVal != null && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded bg-primary" />
                <span className="text-xs text-muted-foreground">{cityName}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{formatAbbrev(cityVal)}</span>
            </div>
          )}
          {comparisonCityNames.map((name, idx) => {
            const val = payload.find((p: any) => p.dataKey === `compare${idx}`)?.value;
            if (val == null) return null;
            return (
              <div key={name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: COMPARE_COLORS[idx] }} />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatAbbrev(val)}</span>
              </div>
            );
          })}
          {natVal != null && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded bg-muted-foreground/50 border-dashed" />
                <span className="text-xs text-muted-foreground">National</span>
              </div>
              <span className="text-sm text-muted-foreground">{formatAbbrev(natVal)}</span>
            </div>
          )}
        </div>
        {(delta !== null || item?.yoy != null) && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 text-xs">
            {item?.yoy != null && (
              <span className={cn('font-medium', metricColor(item.yoy))}>
                {formatSigned(item.yoy)} YoY
              </span>
            )}
            {delta !== null && (
              <span className={cn('font-medium', metricColor(delta))}>
                {formatSigned(delta, 0)} vs national
              </span>
            )}
          </div>
        )}
        {item?.notes && (
          <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/50 leading-snug italic">
            {item.notes.length > 100 ? item.notes.slice(0, 100) + '…' : item.notes}
          </p>
        )}
      </div>
    );
  };

  const yearRange =
    filteredData.length >= 2 ? `${filteredData[0].year}–${filteredData[filteredData.length - 1].year}` : '';

  // Y-axis domain
  const yDomain = useMemo(() => {
    if (filteredData.length === 0) return [0, 'auto'] as [number, string];
    const allValues = filteredData.flatMap((d) => {
      const vals = [d.city, d.national].filter(Boolean) as number[];
      comparisonCityNames.forEach((_, idx) => {
        if (d[`compare${idx}`]) vals.push(d[`compare${idx}`] as number);
      });
      return vals;
    });
    if (allValues.length === 0) return [0, 'auto'] as [number, string];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.15;
    const niceMin = Math.floor((min - padding) / 100_000) * 100_000;
    const niceMax = Math.ceil((max + padding) / 100_000) * 100_000;
    return [Math.max(0, niceMin), niceMax];
  }, [filteredData, comparisonCityNames]);

  // Detect comparison cities with no data
  const comparisonCitiesWithNoData = useMemo(() => {
    if (!isComparing || filteredData.length === 0) return [];
    return comparisonCityNames.filter((_, idx) => {
      const key = `compare${idx}`;
      return !filteredData.some((d) => d[key] != null);
    });
  }, [filteredData, comparisonCityNames, isComparing]);

  const hasNoData = filteredData.length < 2;

  const isOverallPositive = metrics && metrics.totalAppreciation >= 0;

  return (
    <section className="py-16 bg-muted/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Price History</h2>
              <p className="text-muted-foreground text-sm mt-1">
                How {cityName} apartment prices have moved over time
              </p>
            </div>
            {!hasNoData && (
              <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <TabsList className="bg-background">
                  <TabsTrigger value="5y" className="text-xs">5 Years</TabsTrigger>
                  <TabsTrigger value="10y" className="text-xs">10 Years</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* City Comparison Selector */}
          <CityComparisonSelector
            currentCity={cityName}
            selectedCities={compareCities}
            onCitiesChange={setCompareCities}
            availableCities={availableCities}
          />

          {/* Missing data banners */}
          {hasNoData && (
            <InfoBanner variant="info">
              Historical price trend data isn't available for {cityName}. The CBS requires sufficient transaction volume to publish trends.
            </InfoBanner>
          )}

          {comparisonCitiesWithNoData.length > 0 && (
            <InfoBanner variant="info">
              {comparisonCitiesWithNoData.join(' and ')} {comparisonCitiesWithNoData.length === 1 ? "doesn't" : "don't"} have enough transaction data for historical price trends.
            </InfoBanner>
          )}

          {/* Key Metrics — current city only */}
          {!hasNoData && metrics && (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <MetricPill value={metrics.totalAppreciation} label={`total (${metrics.years}yr)`} decimals={0} />
              <MetricPill value={metrics.cagr} label="annual (CAGR)" />
              {metrics.latestYoY != null && <MetricPill value={metrics.latestYoY} label="last year" />}
              {metrics.deltaVsNational != null && (
                <MetricPill value={metrics.deltaVsNational} label="vs national" decimals={0} neutral />
              )}
            </div>
          )}

          {/* Chart — only if we have data */}
          {!hasNoData && (
            <>
          <div className="h-[300px] w-full bg-background rounded-xl border border-border/50 p-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  axisLine={{ className: 'stroke-border' }}
                  tickLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => formatAbbrev(v)}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                  domain={yDomain}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                {/* Peak reference line (only when not comparing) */}
                {!isComparing && metrics && metrics.peakYear !== filteredData[filteredData.length - 1].year && (
                  <ReferenceLine
                    x={metrics.peakYear}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                    label={{
                      value: `Peak ${metrics.peakYear}`,
                      position: 'top',
                      fontSize: 10,
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                  />
                )}
                <Line
                  name={cityName}
                  type="monotone"
                  dataKey="city"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                />
                {/* Comparison city lines */}
                {comparisonCityNames.map((name, idx) => (
                  <Line
                    key={name}
                    name={name}
                    type="monotone"
                    dataKey={`compare${idx}`}
                    stroke={COMPARE_COLORS[idx]}
                    strokeWidth={2}
                    dot={{ fill: COMPARE_COLORS[idx], strokeWidth: 0, r: 2.5 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    connectNulls
                  />
                ))}
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
            {/* Inline legend */}
            <div className="flex items-center gap-4 justify-end -mt-1 px-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded bg-primary" />
                <span className="text-[11px] text-muted-foreground">{cityName}</span>
              </div>
              {comparisonCityNames.map((name, idx) => (
                <div key={name} className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 rounded" style={{ backgroundColor: COMPARE_COLORS[idx] }} />
                  <span className="text-[11px] text-muted-foreground">{name}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded bg-muted-foreground/50 border-t border-dashed border-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">National Avg</span>
              </div>
            </div>
          </div>

          {/* Insight — only when not comparing */}
          {!isComparing && insight && (
            <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
              {isOverallPositive ? (
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">What this means: </span>
                {insight}
              </p>
            </div>
          )}
          </>
          )}


          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <InlineSourceBadge sources={{ CBS: 'Central Bureau of Statistics' }} lastVerified={lastVerified} />
              <span className="text-xs text-muted-foreground">Yearly Data · {yearRange}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Small metric display with directional color coding */
function MetricPill({
  value,
  label,
  decimals = 1,
  neutral = false,
}: {
  value: number;
  label: string;
  decimals?: number;
  neutral?: boolean;
}) {
  const color = neutral ? 'text-foreground' : metricColor(value);
  return (
    <div className="flex items-baseline gap-1 text-sm">
      <span className={cn('font-semibold tabular-nums', color)}>{formatSigned(value, decimals)}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
