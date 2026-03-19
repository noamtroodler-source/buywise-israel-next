import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RoomSpecificPrice {
  avgPrice: number;
  avgPriceSqm: number;
  yoyChange: number | null;
  fiveYearChange: number | null;
  quarter: number;
  year: number;
  /** True when the exact room count isn't in city_price_history and we used a proxy */
  isFallback: boolean;
  /** The room count actually queried (may differ from requested) */
  queriedRooms: number;
}

const AVG_SIZE_BY_ROOMS: Record<number, number> = {
  1: 35,
  2: 55,
  3: 75,
  4: 100,
  5: 130,
  6: 155,
  7: 180,
  8: 210,
};

/**
 * Returns the room count to actually query in city_price_history (3-5 only)
 * and a scaling factor to approximate the requested room count.
 */
function getQueryParams(rooms: number): { queryRooms: number; scaleFactor: number; isFallback: boolean } {
  if (rooms >= 3 && rooms <= 5) {
    return { queryRooms: rooms, scaleFactor: 1, isFallback: false };
  }
  // For rooms > 5: use 5-room data scaled up by size ratio
  if (rooms > 5) {
    const targetSize = AVG_SIZE_BY_ROOMS[rooms] || (130 + (rooms - 5) * 25);
    const baseSize = AVG_SIZE_BY_ROOMS[5]; // 130
    return { queryRooms: 5, scaleFactor: targetSize / baseSize, isFallback: true };
  }
  // For rooms < 3: use 3-room data scaled down
  const targetSize = AVG_SIZE_BY_ROOMS[rooms] || 55;
  const baseSize = AVG_SIZE_BY_ROOMS[3]; // 75
  return { queryRooms: 3, scaleFactor: targetSize / baseSize, isFallback: true };
}

/**
 * Fetches the latest room-specific average price from city_price_history
 * and computes YoY change by comparing to the same quarter one year prior.
 *
 * Supports all room counts: 3-5 are exact matches, others use nearest proxy
 * with size-based scaling and set isFallback=true.
 *
 * IMPORTANT: The `rooms` parameter expects the Israeli government standard total room count
 * (bedrooms + additional rooms like living room, mamad, office), NOT BuyWise bedrooms alone.
 * Use getIsraeliRoomCount() from '@/lib/israeliRoomCount' to convert before calling this hook.
 */
export function useRoomSpecificCityPrice(city: string | null, rooms: number | null) {
  const normalizedCity = city
    ?.replace(/['']/g, '')
    ?.trim() || '';

  return useQuery<RoomSpecificPrice | null>({
    queryKey: ['room-specific-city-price', normalizedCity, rooms],
    queryFn: async () => {
      if (!normalizedCity || !rooms || rooms < 1) return null;

      const { queryRooms, scaleFactor, isFallback } = getQueryParams(rooms);

      // Fetch ~6 years of data to compute both YoY and 5-year change
      const { data, error } = await supabase
        .from('city_price_history')
        .select('avg_price_nis, year, quarter, rooms')
        .ilike('city_en', normalizedCity)
        .eq('rooms', queryRooms)
        .not('avg_price_nis', 'is', null)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(24);

      if (error || !data || data.length === 0) return null;

      const latest = data[0];
      if (!latest.avg_price_nis) return null;

      // Average last 4 quarters (1 year) for a stable baseline
      const recentPrices = data.slice(0, 4).filter(d => d.avg_price_nis != null);
      const baseAvgPrice = recentPrices.length > 0
        ? Math.round(recentPrices.reduce((sum, d) => sum + (d.avg_price_nis ?? 0), 0) / recentPrices.length)
        : latest.avg_price_nis;

      // Apply scaling for fallback room counts
      const avgPriceNis = Math.round(baseAvgPrice * scaleFactor);

      const avgSize = AVG_SIZE_BY_ROOMS[rooms] || (rooms > 5 ? 130 + (rooms - 5) * 25 : 55);
      const avgPriceSqm = Math.round(avgPriceNis / avgSize);

      // Find same quarter one year prior for YoY (use raw data, not scaled — % change is scale-independent)
      const priorYear = latest.year - 1;
      const priorEntry = data.find(
        (d) => d.year === priorYear && d.quarter === latest.quarter
      );

      let yoyChange: number | null = null;
      if (priorEntry?.avg_price_nis && latest.avg_price_nis) {
        yoyChange = Math.round(
          ((latest.avg_price_nis - priorEntry.avg_price_nis) / priorEntry.avg_price_nis) * 100
        );
      }

      // Find same quarter 5 years prior
      const fiveYearPrior = data.find(
        (d) => d.year === latest.year - 5 && d.quarter === latest.quarter
      );
      let fiveYearChange: number | null = null;
      if (fiveYearPrior?.avg_price_nis && latest.avg_price_nis) {
        fiveYearChange = Math.round(
          ((latest.avg_price_nis - fiveYearPrior.avg_price_nis) / fiveYearPrior.avg_price_nis) * 100
        );
      }

      return {
        avgPrice: avgPriceNis,
        avgPriceSqm,
        yoyChange,
        fiveYearChange,
        quarter: latest.quarter,
        year: latest.year,
        isFallback,
        queriedRooms: queryRooms,
      };
    },
    enabled: !!normalizedCity && rooms !== null && rooms >= 1,
    staleTime: 30 * 60 * 1000, // 30 min
  });
}
