import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface IllustrationEntry {
  city_slug: string;
  neighborhood_name: string;
  image_url: string;
}

// Normalize city name to slug: "Tel Aviv" -> "tel-aviv", "Modi'in" -> "modiin"
function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Global cache query for all completed illustrations
function useIllustrationMap() {
  return useQuery({
    queryKey: ['neighborhood-illustrations-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhood_illustrations')
        .select('city_slug, neighborhood_name, image_url')
        .eq('status', 'completed');

      if (error) throw error;

      // Build lookup map: "city_slug::neighborhood_name" -> image_url
      const map = new Map<string, string>();
      for (const row of (data as IllustrationEntry[]) || []) {
        const key = `${row.city_slug}::${row.neighborhood_name.toLowerCase()}`;
        map.set(key, row.image_url);
      }
      return map;
    },
    staleTime: 30 * 60 * 1000, // 30 min cache
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Get illustration URL for a property's neighborhood.
 * Returns the illustration URL or undefined if not found.
 */
export function useNeighborhoodIllustration(
  city: string | null | undefined,
  neighborhood: string | null | undefined
): string | undefined {
  const { data: map } = useIllustrationMap();

  if (!map || !city || !neighborhood) return undefined;

  const slug = cityToSlug(city);
  const key = `${slug}::${neighborhood.toLowerCase()}`;
  return map.get(key);
}
