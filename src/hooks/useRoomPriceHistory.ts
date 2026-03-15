import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoomPriceDataPoint {
  year: number;
  quarter: number;
  label: string;
  room3: number | null;
  room4: number | null;
  room5: number | null;
}

export interface RoomLatestPrice {
  roomType: number;
  price: number;
  yoyChange: number | null;
}

function normalizeCityName(name: string): string {
  return name.replace(/['']/g, '');
}

function slugToCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useRoomPriceHistory(citySlug: string) {
  return useQuery({
    queryKey: ['room-price-history', citySlug],
    queryFn: async () => {
      const { data: cityData } = await supabase
        .from('cities')
        .select('name')
        .eq('slug', citySlug)
        .maybeSingle();

      const cityName = normalizeCityName(cityData?.name || slugToCityName(citySlug));

      const { data, error } = await supabase
        .from('city_price_history')
        .select('*')
        .eq('city_en', cityName)
        .in('rooms', [3, 4, 5])
        .order('year', { ascending: true })
        .order('quarter', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return { chartData: [], latestPrices: [] };

      // Group by year+quarter, merge room types
      const grouped = new Map<string, RoomPriceDataPoint>();
      for (const row of data) {
        if (!row.avg_price_nis) continue;
        const key = `${row.year}-Q${row.quarter}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            year: row.year,
            quarter: row.quarter,
            label: `Q${row.quarter} ${row.year}`,
            room3: null,
            room4: null,
            room5: null,
          });
        }
        const point = grouped.get(key)!;
        if (row.rooms === 3) point.room3 = row.avg_price_nis;
        else if (row.rooms === 4) point.room4 = row.avg_price_nis;
        else if (row.rooms === 5) point.room5 = row.avg_price_nis;
      }

      const chartData = [...grouped.values()].sort(
        (a, b) => a.year - b.year || a.quarter - b.quarter
      );

      // Compute latest prices with YoY change
      const latestPrices: RoomLatestPrice[] = [];
      for (const roomType of [3, 4, 5] as const) {
        const key = `room${roomType}` as keyof RoomPriceDataPoint;
        const latest = [...chartData].reverse().find(d => d[key] != null);
        if (!latest) continue;

        const currentPrice = latest[key] as number;
        // Find same quarter previous year
        const prevYear = chartData.find(
          d => d.year === latest.year - 1 && d.quarter === latest.quarter && d[key] != null
        );
        const yoyChange = prevYear
          ? Math.round(((currentPrice - (prevYear[key] as number)) / (prevYear[key] as number)) * 1000) / 10
          : null;

        latestPrices.push({ roomType, price: currentPrice, yoyChange });
      }

      return { chartData, latestPrices };
    },
    enabled: !!citySlug,
  });
}
