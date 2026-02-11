import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CityTransitInfo {
  hasTrainStation: boolean;
  trainStationName: string | null;
  trainStationLat: number | null;
  trainStationLng: number | null;
  cityName: string;
}

function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function useCityTransitInfo(cityName: string | undefined) {
  return useQuery({
    queryKey: ['city-transit-info', cityName],
    queryFn: async (): Promise<CityTransitInfo | null> => {
      if (!cityName) return null;

      // Try exact name match first
      let { data } = await supabase
        .from('cities')
        .select('name, has_train_station, train_station_name, train_station_lat, train_station_lng')
        .ilike('name', cityName)
        .maybeSingle();

      // Fallback to slug match
      if (!data) {
        const slug = normalizeToSlug(cityName);
        const { data: slugMatch } = await supabase
          .from('cities')
          .select('name, has_train_station, train_station_name, train_station_lat, train_station_lng')
          .eq('slug', slug)
          .maybeSingle();
        data = slugMatch;
      }

      if (!data) return null;

      return {
        hasTrainStation: data.has_train_station ?? false,
        trainStationName: data.train_station_name,
        trainStationLat: data.train_station_lat,
        trainStationLng: data.train_station_lng,
        cityName: data.name,
      };
    },
    enabled: !!cityName,
    staleTime: 1000 * 60 * 60,
  });
}
