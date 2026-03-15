import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { InlineSourceBadge } from '@/components/shared/InlineSourceBadge';
import { InfoBanner } from '@/components/tools/shared/InfoBanner';
import { useRoomPriceHistory } from '@/hooks/useRoomPriceHistory';
import { useRoomPriceComparison } from '@/hooks/useRoomPriceComparison';
import { useCities } from '@/hooks/useCities';
import { CityComparisonSelector } from './CityComparisonSelector';
import { cn } from '@/lib/utils';

interface PriceByApartmentSizeProps {
  citySlug: string;
  cityName: string;
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
}

const ROOM_CONFIG = [
  { key: 'room3' as const, rooms: 3, label: '3-Room', color: 'hsl(var(--primary))' },
  { key: 'room4' as const, rooms: 4, label: '4-Room', color: '#1FA3A3' },
  { key: 'room5' as const, rooms: 5, label: '5-Room', color: '#D4930D' },
];

const CITY_COLORS = ['hsl(var(--primary))', '#1FA3A3', '#6366F1'];

function formatAbbrev(value: number): string {
  if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₪${(value / 1_000).toFixed(0)}K`;
  return `₪${value.toLocaleString()}`;
}

function formatPrice(value: number): string {
  return `₪${value.toLocaleString()}`;
}

function metricColor(value: number): string {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

function formatSigned(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

export function PriceByApartmentSize({
  citySlug,
  cityName,
  dataSources,
  lastVerified,
}: PriceByApartmentSizeProps) {
  const [compareCities, setCompareCities] = useState<string[]>([cityName]);
  const [selectedRoom, setSelectedRoom] = useState<number>(3);

  const { data } = useRoomPriceHistory(citySlug);
  const { data: allCities = [] } = useCities();
  const chartData = data?.chartData ?? [];
  const latestPrices = data?.latestPrices ?? [];

  const comparisonCityNames = compareCities.filter((c) => c !== cityName);
  const isComparing = comparisonCityNames.length > 0;

  // Get slugs for comparison cities
  const comparisonSlugs = useMemo(() => {
    return comparisonCityNames
      .map((name) => allCities.find((c) => c.name === name)?.slug)
      .filter(Boolean) as string[];
  }, [comparisonCityNames, allCities]);

  // Fetch comparison data for the selected room type
  const allCompareSlugs = useMemo(
    () => (isComparing ? [citySlug, ...comparisonSlugs] : []),
    [isComparing, citySlug, comparisonSlugs],
  );
  const { data: comparisonData } = useRoomPriceComparison(allCompareSlugs, selectedRoom);

  const availableCities = useMemo(
    () => allCities.map((c) => ({ name: c.name, slug: c.slug })),
    [allCities],
  );

  // Show last 4 years of data
  const displayData = useMemo(() => {
    if (chartData.length === 0) return [];
    const currentYear = new Date().getFullYear();
    return chartData.filter((d) => d.year >= currentYear - 4);
  }, [chartData]);

  // Comparison display data (last 4 years)
  const compDisplayData = useMemo(() => {
    if (!comparisonData?.chartData?.length) return [];
    const currentYear = new Date().getFullYear();
    return comparisonData.chartData.filter((d) => (d.year as number) >= currentYear - 4);
  }, [comparisonData]);

  // Y-axis domain for normal mode
  const yDomainNormal = useMemo(() => {
    if (displayData.length === 0) return [0, 'auto'] as [number, string];
    const allValues = displayData.flatMap((d) =>
      [d.room3, d.room4, d.room5].filter(Boolean) as number[],
    );
    if (allValues.length === 0) return [0, 'auto'] as [number, string];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.15;
    const niceMin = Math.floor((min - padding) / 100_000) * 100_000;
    const niceMax = Math.ceil((max + padding) / 100_000) * 100_000;
    return [Math.max(0, niceMin), niceMax];
  }, [displayData]);

  // Y-axis domain for comparison mode
  const yDomainCompare = useMemo(() => {
    if (compDisplayData.length === 0) return [0, 'auto'] as [number, string];
    const allValues = compDisplayData.flatMap((d) => {
      const vals: number[] = [];
      allCompareSlugs.forEach((slug) => {
        const v = d[slug];
        if (typeof v === 'number') vals.push(v);
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
  }, [compDisplayData, allCompareSlugs]);

  // All city slugs with names for comparison legend
  const citySlugNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    map[citySlug] = cityName;
    comparisonSlugs.forEach((slug, i) => {
      map[slug] = comparisonCityNames[i];
    });
    return map;
  }, [citySlug, cityName, comparisonSlugs, comparisonCityNames]);

  // Tooltip for normal mode
  const NormalTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-foreground text-sm mb-2">{label}</p>
        <div className="space-y-1.5">
          {ROOM_CONFIG.map((room) => {
            const entry = payload.find((p: any) => p.dataKey === room.key);
            if (!entry?.value) return null;
            return (
              <div key={room.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: room.color }} />
                  <span className="text-xs text-muted-foreground">{room.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatPrice(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Tooltip for comparison mode
  const CompareTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-foreground text-sm mb-2">
          {label} · {ROOM_CONFIG.find((r) => r.rooms === selectedRoom)?.label}
        </p>
        <div className="space-y-1.5">
          {allCompareSlugs.map((slug, idx) => {
            const entry = payload.find((p: any) => p.dataKey === slug);
            if (!entry?.value) return null;
            return (
              <div key={slug} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: CITY_COLORS[idx] }} />
                  <span className="text-xs text-muted-foreground">{citySlugNameMap[slug]}</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatPrice(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasNoData = latestPrices.length === 0 || displayData.length < 2;

  // Detect partial room data (e.g. Efrat only has 5-room)
  const availableRoomTypes = ROOM_CONFIG.filter((room) =>
    latestPrices.some((p) => p.roomType === room.rooms),
  );
  const missingRoomTypes = ROOM_CONFIG.filter(
    (room) => !latestPrices.some((p) => p.roomType === room.rooms),
  );
  const hasPartialData = !hasNoData && missingRoomTypes.length > 0 && availableRoomTypes.length > 0;

  // Detect comparison cities with no data for selected room type
  const comparisonCitiesWithNoData = useMemo(() => {
    if (!isComparing || compDisplayData.length === 0) return [];
    return comparisonSlugs.filter((slug) => {
      return !compDisplayData.some((d) => d[slug] != null);
    });
  }, [compDisplayData, comparisonSlugs, isComparing]);

  const compCityNamesWithNoData = comparisonCitiesWithNoData.map(
    (slug) => citySlugNameMap[slug] || slug,
  );

  const selectedRoomLabel = ROOM_CONFIG.find((r) => r.rooms === selectedRoom)?.label || `${selectedRoom}-Room`;

  const yearRange =
    displayData.length >= 2 ? `${displayData[0].label}–${displayData[displayData.length - 1].label}` : '';

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Price by Apartment Size</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Average transaction prices by room count in {cityName}
            </p>
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
              Room-specific price data isn't available for {cityName}. The CBS requires a minimum number of transactions per room type to publish data.
            </InfoBanner>
          )}

          {compCityNamesWithNoData.length > 0 && !hasNoData && (
            <InfoBanner variant="info">
              {compCityNamesWithNoData.join(' and ')} {compCityNamesWithNoData.length === 1 ? "doesn't" : "don't"} have {selectedRoomLabel.toLowerCase()} transaction data available.
            </InfoBanner>
          )}

          {isComparing && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50 w-fit">
              {ROOM_CONFIG.map((room) => (
                <button
                  key={room.rooms}
                  onClick={() => setSelectedRoom(room.rooms)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    selectedRoom === room.rooms
                      ? 'bg-background text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {room.label}
                </button>
              ))}
            </div>
          )}

          {!hasNoData && (
          <>
          {/* Summary cards — normal mode only */}
          {!isComparing && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ROOM_CONFIG.map((room) => {
                const priceData = latestPrices.find((p) => p.roomType === room.rooms);
                if (!priceData) return null;
                return (
                  <div
                    key={room.key}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/30"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${room.color}15` }}
                    >
                      <Home className="h-4 w-4" style={{ color: room.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{room.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-foreground tabular-nums">
                          {formatAbbrev(priceData.price)}
                        </span>
                        {priceData.yoyChange != null && (
                          <span className={cn('text-xs font-medium', metricColor(priceData.yoyChange))}>
                            {formatSigned(priceData.yoyChange)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Partial data notice */}
          {hasPartialData && !isComparing && (
            <InfoBanner variant="info">
              Data available for {availableRoomTypes.map((r) => r.label).join(', ')} apartments only. Other room types have insufficient transaction volume.
            </InfoBanner>
          )}

          {/* Chart */}
          <div className="h-[300px] w-full bg-muted/20 rounded-xl border border-border/50 p-4 pt-2">
            {!isComparing ? (
              /* Normal mode: 3 room lines for current city */
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      className="text-muted-foreground"
                      axisLine={{ className: 'stroke-border' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={formatAbbrev}
                      axisLine={false}
                      tickLine={false}
                      width={68}
                      domain={yDomainNormal}
                    />
                    <RechartsTooltip content={<NormalTooltip />} />
                    {ROOM_CONFIG.map((room) => (
                      <Line
                        key={room.key}
                        name={room.label}
                        type="monotone"
                        dataKey={room.key}
                        stroke={room.color}
                        strokeWidth={2}
                        dot={{ fill: room.color, strokeWidth: 0, r: 2 }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                {/* Normal legend */}
                <div className="flex items-center gap-4 justify-end -mt-1 px-2">
                  {ROOM_CONFIG.map((room) => (
                    <div key={room.key} className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 rounded" style={{ backgroundColor: room.color }} />
                      <span className="text-[11px] text-muted-foreground">{room.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Comparison mode: single room type across cities */
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compDisplayData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      className="text-muted-foreground"
                      axisLine={{ className: 'stroke-border' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={formatAbbrev}
                      axisLine={false}
                      tickLine={false}
                      width={68}
                      domain={yDomainCompare}
                    />
                    <RechartsTooltip content={<CompareTooltip />} />
                    {allCompareSlugs.map((slug, idx) => (
                      <Line
                        key={slug}
                        name={citySlugNameMap[slug]}
                        type="monotone"
                        dataKey={slug}
                        stroke={CITY_COLORS[idx]}
                        strokeWidth={2}
                        dot={{ fill: CITY_COLORS[idx], strokeWidth: 0, r: 2.5 }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                {/* Comparison legend */}
                <div className="flex items-center gap-4 justify-end -mt-1 px-2 flex-wrap">
                  {allCompareSlugs.map((slug, idx) => (
                    <div key={slug} className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 rounded" style={{ backgroundColor: CITY_COLORS[idx] }} />
                      <span className="text-[11px] text-muted-foreground">{citySlugNameMap[slug]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          </>
          )}

          {/* Source attribution */}
          <div className="flex items-center gap-2 flex-wrap">
            <InlineSourceBadge sources={{ CBS: 'Central Bureau of Statistics' }} lastVerified={lastVerified} />
            <span className="text-xs text-muted-foreground">Quarterly Data · {yearRange}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
