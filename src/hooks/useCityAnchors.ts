import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CityAnchor {
  id: string;
  city_id: string;
  anchor_type: 'orientation' | 'daily_life' | 'mobility';
  name: string;
  name_he: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  icon: string | null;
  display_order: number;
  created_at: string;
}

export function useCityAnchors(cityName: string | undefined) {
  return useQuery({
    queryKey: ['city-anchors', cityName],
    queryFn: async () => {
      if (!cityName) return [];
      
      // First get city_id by name (case-insensitive)
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('id')
        .ilike('name', cityName)
        .single();
      
      if (cityError || !cityData) {
        return [];
      }

      // Then fetch anchors for that city
      const { data, error } = await supabase
        .from('city_anchors')
        .select('*')
        .eq('city_id', cityData.id)
        .order('display_order');

      if (error) {
        console.error('Error fetching city anchors:', error);
        return [];
      }

      return (data || []) as CityAnchor[];
    },
    enabled: !!cityName,
    staleTime: 1000 * 60 * 60, // 1 hour - city anchors rarely change
  });
}
