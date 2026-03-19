import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MapPoi {
  id: string;
  name: string;
  name_he: string | null;
  category: string;
  subcategory: string | null;
  city: string;
  latitude: number;
  longitude: number;
  description: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
}

export function useMapPois(categories: string[]) {
  return useQuery({
    queryKey: ['map-pois', categories],
    queryFn: async () => {
      if (categories.length === 0) return [];
      const { data, error } = await supabase
        .from('map_pois')
        .select('*')
        .in('category', categories);
      if (error) throw error;
      return (data ?? []) as MapPoi[];
    },
    enabled: categories.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}
