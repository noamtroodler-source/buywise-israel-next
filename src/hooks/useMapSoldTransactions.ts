import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LatLngBounds } from 'leaflet';

export interface MapSoldTransaction {
  id: string;
  sold_price: number;
  sold_date: string;
  rooms: number | null;
  size_sqm: number | null;
  property_type: string | null;
  price_per_sqm: number | null;
  address: string;
  latitude: number;
  longitude: number;
}

export function useMapSoldTransactions(bounds: LatLngBounds | null, enabled: boolean) {
  const south = bounds?.getSouth();
  const north = bounds?.getNorth();
  const west = bounds?.getWest();
  const east = bounds?.getEast();

  return useQuery({
    queryKey: ['map-sold-transactions', south, north, west, east],
    queryFn: async (): Promise<MapSoldTransaction[]> => {
      if (!bounds) return [];

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 12);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sold_transactions')
        .select('id, sold_price, sold_date, rooms, size_sqm, property_type, price_per_sqm, address, latitude, longitude')
        .gte('latitude', south!)
        .lte('latitude', north!)
        .gte('longitude', west!)
        .lte('longitude', east!)
        .gte('sold_date', cutoffStr)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('sold_date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching sold transactions for map:', error);
        throw error;
      }

      return (data || []) as MapSoldTransaction[];
    },
    enabled: enabled && !!bounds,
    staleTime: 5 * 60 * 1000,
  });
}
