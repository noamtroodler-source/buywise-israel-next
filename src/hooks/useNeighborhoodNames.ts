import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NeighborhoodInfo {
  name: string;
  city: string;
}

/**
 * Fetch neighborhood names for a specific city from the cities table.
 */
export function useNeighborhoodNames(cityName: string | null | undefined) {
  return useQuery({
    queryKey: ['neighborhood-names', cityName],
    queryFn: async () => {
      if (!cityName) return [];
      const { data, error } = await supabase
        .from('cities')
        .select('neighborhoods')
        .eq('name', cityName)
        .single();

      if (error || !data?.neighborhoods) return [];
      const raw = data.neighborhoods as any[];
      if (!Array.isArray(raw)) return [];

      return raw
        .filter((n: any) => n.name)
        .map((n: any) => n.name as string)
        .sort();
    },
    enabled: !!cityName,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch ALL neighborhood+city pairs across all cities. Used for search autocomplete.
 */
export function useAllNeighborhoods() {
  return useQuery({
    queryKey: ['all-neighborhood-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('name, neighborhoods')
        .order('name');

      if (error || !data) return [];

      const results: NeighborhoodInfo[] = [];
      for (const city of data) {
        const raw = city.neighborhoods as any[];
        if (!Array.isArray(raw)) continue;
        for (const n of raw) {
          if (n.name) {
            results.push({ name: n.name as string, city: city.name });
          }
        }
      }
      return results;
    },
    staleTime: 10 * 60 * 1000,
  });
}
