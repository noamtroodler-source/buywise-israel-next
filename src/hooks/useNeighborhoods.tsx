import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Neighborhood {
  id: string;
  name: string;
  hebrew_name: string | null;
  city_name: string;
  city_id: string | null;
  character: string | null;
  price_tier: string | null;
  avg_price_sqm: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  anglo_presence: string | null;
  target_buyers: string | null;
  pros: string[] | null;
  cons: string[] | null;
  near_train: boolean | null;
  near_beach: boolean | null;
  has_good_schools: boolean | null;
  is_religious: boolean | null;
  walkability_score: number | null;
}

export function useNeighborhoods(cityName?: string) {
  return useQuery({
    queryKey: ['neighborhoods', cityName],
    queryFn: async () => {
      let query = supabase
        .from('neighborhoods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (cityName) {
        query = query.eq('city_name', cityName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Neighborhood[];
    },
  });
}

export function useNeighborhoodsByCity(citySlug: string) {
  return useQuery({
    queryKey: ['neighborhoods-by-slug', citySlug],
    queryFn: async () => {
      const cityName = citySlug.split('-').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' ');

      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .ilike('city_name', cityName)
        .order('sort_order');

      if (error) throw error;
      return data as Neighborhood[];
    },
    enabled: !!citySlug,
  });
}
