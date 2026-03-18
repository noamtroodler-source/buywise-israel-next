import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NearbySoldComp } from '@/types/soldTransactions';

interface UseNearbySoldCompsOptions {
  radiusKm?: number;
  monthsBack?: number;
  limit?: number;
  minRooms?: number;
  maxRooms?: number;
}

export function useNearbySoldComps(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  city: string,
  options: UseNearbySoldCompsOptions = {}
) {
  const {
    radiusKm = 0.5,
    monthsBack = 24,
    limit = 5,
    minRooms,
    maxRooms,
  } = options;

  return useQuery({
    queryKey: ['nearby-sold-comps', latitude, longitude, city, radiusKm, monthsBack, limit, minRooms, maxRooms],
    queryFn: async (): Promise<NearbySoldComp[]> => {
      if (!latitude || !longitude || !city) {
        return [];
      }

      const { data, error } = await supabase.rpc('get_nearby_sold_comps', {
        p_lat: latitude,
        p_lng: longitude,
        p_city: city,
        p_radius_km: radiusKm,
        p_months_back: monthsBack,
        p_limit: limit,
        p_min_rooms: minRooms ?? null,
        p_max_rooms: maxRooms ?? null,
      });

      if (error) {
        console.error('Error fetching nearby sold comps:', error);
        throw error;
      }

      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        sold_price: row.sold_price as number,
        sold_date: row.sold_date as string,
        rooms: row.rooms as number | null,
        size_sqm: row.size_sqm as number | null,
        property_type: row.property_type as string | null,
        price_per_sqm: row.price_per_sqm as number | null,
        distance_meters: row.distance_meters as number,
        is_same_building: row.is_same_building as boolean,
      }));
    },
    enabled: Boolean(latitude && longitude && city),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
