import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RoomSpecificPrice {
  avgPrice: number;
  avgPriceSqm: number;
  yoyChange: number | null;
  fiveYearChange: number | null;
  quarter: number;
  year: number;
}

const AVG_SIZE_BY_ROOMS: Record<number, number> = {
  3: 75,
  4: 100,
  5: 130,
};

/**
 * Fetches the latest room-specific average price from city_price_history
 * and computes YoY change by comparing to the same quarter one year prior.
 * Only supports 3, 4, 5 rooms (the room counts tracked in city_price_history).
 */
export function useRoomSpecificCityPrice(city: string | null, rooms: number | null) {
  const supported = rooms !== null && rooms >= 3 && rooms <= 5;
  const normalizedCity = city
    ?.replace(/['']/g, '')
    ?.trim() || '';

  return useQuery<RoomSpecificPrice | null>({
    queryKey: ['room-specific-city-price', normalizedCity, rooms],
    queryFn: async () => {
      if (!normalizedCity || !rooms) return null;

      // Fetch ~6 years of data to compute both YoY and 5-year change
      const { data, error } = await supabase
        .from('city_price_history')
        .select('avg_price_nis, year, quarter, rooms')
        .ilike('city_en', normalizedCity)
        .eq('rooms', rooms)
        .not('avg_price_nis', 'is', null)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(24);

      if (error || !data || data.length === 0) return null;

      const latest = data[0];
      if (!latest.avg_price_nis) return null;

      // Average last 4 quarters (1 year) for a stable baseline
      const recentPrices = data.slice(0, 4).filter(d => d.avg_price_nis != null);
      const avgPriceNis = recentPrices.length > 0
        ? Math.round(recentPrices.reduce((sum, d) => sum + (d.avg_price_nis ?? 0), 0) / recentPrices.length)
        : latest.avg_price_nis;

      const avgSize = AVG_SIZE_BY_ROOMS[rooms] || 100;
      const avgPriceSqm = Math.round(avgPriceNis / avgSize);

      // Find same quarter one year prior for YoY
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
        avgPrice: latest.avg_price_nis,
        avgPriceSqm,
        yoyChange,
        fiveYearChange,
        quarter: latest.quarter,
        year: latest.year,
      };
    },
    enabled: supported && !!normalizedCity,
    staleTime: 30 * 60 * 1000, // 30 min
  });
}
