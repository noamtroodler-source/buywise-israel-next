import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CityRoomPrice {
  rooms: number;
  avgPrice: number;
  year: number;
  quarter: number;
}

/**
 * Fetches the latest average price for 3, 4, and 5-room apartments
 * in a given city from city_price_history.
 */
export function useCityRoomPrices(city: string | null) {
  const normalizedCity = city?.replace(/['']/g, '')?.trim() || '';

  return useQuery<CityRoomPrice[]>({
    queryKey: ['city-room-prices', normalizedCity],
    queryFn: async () => {
      if (!normalizedCity) return [];

      const { data, error } = await supabase
        .from('city_price_history')
        .select('avg_price_nis, year, quarter, rooms')
        .ilike('city_en', normalizedCity)
        .in('rooms', [3, 4, 5])
        .not('avg_price_nis', 'is', null)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(30); // ~10 per room type, enough to get latest for each

      if (error || !data?.length) return [];

      // Get the latest entry per room count
      const latestByRoom = new Map<number, CityRoomPrice>();
      for (const row of data) {
        if (!latestByRoom.has(row.rooms) && row.avg_price_nis) {
          latestByRoom.set(row.rooms, {
            rooms: row.rooms,
            avgPrice: row.avg_price_nis,
            year: row.year,
            quarter: row.quarter,
          });
        }
      }

      return Array.from(latestByRoom.values()).sort((a, b) => a.rooms - b.rooms);
    },
    enabled: !!normalizedCity,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Fetches distinct city names available in city_price_history.
 */
export function useAvailableCities() {
  return useQuery<string[]>({
    queryKey: ['available-cities-price-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_price_history')
        .select('city_en')
        .not('avg_price_nis', 'is', null)
        .order('city_en');

      if (error || !data) return [];

      // Deduplicate
      const unique = [...new Set(data.map((d) => d.city_en))];
      return unique.sort();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
