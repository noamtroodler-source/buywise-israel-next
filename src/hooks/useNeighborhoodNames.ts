import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isAngloNeighborhood } from '@/lib/angloNeighborhoodTags';

export interface NeighborhoodItem {
  name: string;
  isAnglo: boolean;
}

export interface NeighborhoodInfo {
  name: string;
  city: string;
  isAnglo: boolean;
}

function sortAngloFirst(items: NeighborhoodItem[]): NeighborhoodItem[] {
  return [...items].sort((a, b) => {
    if (a.isAnglo && !b.isAnglo) return -1;
    if (!a.isAnglo && b.isAnglo) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Fetch neighborhood names for a specific city from the cities table.
 * Returns objects with anglo tagging, sorted anglo-first.
 */
export function useNeighborhoodNames(cityName: string | null | undefined) {
  return useQuery({
    queryKey: ['neighborhood-names', cityName],
    queryFn: async (): Promise<NeighborhoodItem[]> => {
      if (!cityName) return [];
      const { data, error } = await supabase
        .from('cities')
        .select('slug, neighborhoods')
        .eq('name', cityName)
        .single();

      if (error || !data?.neighborhoods) return [];
      const raw = data.neighborhoods as any[];
      if (!Array.isArray(raw)) return [];

      const items: NeighborhoodItem[] = raw
        .filter((n: any) => n.name)
        .map((n: any) => ({
          name: n.name as string,
          isAnglo: isAngloNeighborhood(data.slug, n.name as string),
        }));

      return sortAngloFirst(items);
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
    queryFn: async (): Promise<NeighborhoodInfo[]> => {
      const { data, error } = await supabase
        .from('cities')
        .select('name, slug, neighborhoods')
        .order('name');

      if (error || !data) return [];

      const results: NeighborhoodInfo[] = [];
      for (const city of data) {
        const raw = city.neighborhoods as any[];
        if (!Array.isArray(raw)) continue;
        for (const n of raw) {
          if (n.name) {
            results.push({
              name: n.name as string,
              city: city.name,
              isAnglo: isAngloNeighborhood(city.slug, n.name as string),
            });
          }
        }
      }
      return results;
    },
    staleTime: 10 * 60 * 1000,
  });
}
