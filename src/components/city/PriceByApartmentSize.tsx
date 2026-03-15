import { useMemo } from 'react';
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
import { useRoomPriceHistory } from '@/hooks/useRoomPriceHistory';
import { cn } from '@/lib/utils';

interface PriceByApartmentSizeProps {
  citySlug: string;
  cityName: string;
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
}

const ROOM_CONFIG = [
  { key: 'room3' as const, label: '3-Room', color: 'hsl(var(--primary))' },
  { key: 'room4' as const, label: '4-Room', color: '#1FA3A3' },
  { key: 'room5' as const, label: '5-Room', color: '#D4930D' },
];

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
  const { data } = useRoomPriceHistory(citySlug);
  const chartData = data?.chartData ?? [];
  const latestPrices = data?.latestPrices ?? [];

  // Show only ~last 4 years of quarterly data to avoid overcrowding
  const displayData = useMemo(() => {
    if (chartData.length === 0) return [];
    const currentYear = new Date().getFullYear();
    return chartData.filter(d => d.year >= currentYear - 4);
  }, [chartData]);

  // Y-axis domain
  const yDomain = useMemo(() => {
    if (displayData.length === 0) return [0, 'auto'] as [number, string];
    const allValues = displayData.flatMap(d =>
      [d.room3, d.room4, d.room5].filter(Boolean) as number[]
    );
    if (allValues.length === 0) return [0, 'auto'] as [number, string];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.15;
    const niceMin = Math.floor((min - padding) / 100_000) * 100_000;
    const niceMax = Math.ceil((max + padding) / 100_000) * 100_000;
    return [Math.max(0, niceMin), niceMax];
  }, [displayData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-foreground text-sm mb-2">{label}</p>
        <div className="space-y-1.5">
          {ROOM_CONFIG.map(room => {
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

  // Don't render if no room-specific data
  if (latestPrices.length === 0 || displayData.length < 2) return null;

  const yearRange = displayData.length >= 2
    ? `${displayData[0].label}–${displayData[displayData.length - 1].label}`
    : '';

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
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Price by Apartment Size
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Average transaction prices by room count in {cityName}
            </p>
          </div>

          {/* Latest price summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROOM_CONFIG.map(room => {
              const priceData = latestPrices.find(p => p.roomType === parseInt(room.key.replace('room', '')));
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

          {/* Chart */}
          <div className="h-[300px] w-full bg-muted/20 rounded-xl border border-border/50 p-4 pt-2">
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
                  domain={yDomain}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                {ROOM_CONFIG.map(room => (
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
            {/* Inline legend */}
            <div className="flex items-center gap-4 justify-end -mt-1 px-2">
              {ROOM_CONFIG.map(room => (
                <div key={room.key} className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 rounded" style={{ backgroundColor: room.color }} />
                  <span className="text-[11px] text-muted-foreground">{room.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source attribution */}
          <div className="flex items-center gap-2 flex-wrap">
            <InlineSourceBadge
              sources={{ CBS: 'Central Bureau of Statistics' }}
              lastVerified={lastVerified}
            />
            <span className="text-xs text-muted-foreground">
              Quarterly Data · {yearRange}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
