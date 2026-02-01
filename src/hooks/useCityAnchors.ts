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

// Normalize city name to slug format for matching
function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '') // Remove apostrophes
    .replace(/\s+/g, '-')  // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, ''); // Remove other special chars
}

export function useCityAnchors(cityName: string | undefined) {
  return useQuery({
    queryKey: ['city-anchors', cityName],
    queryFn: async () => {
      if (!cityName) return [];
      
      // Try matching by exact name first (case-insensitive)
      let { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('id')
        .ilike('name', cityName)
        .maybeSingle();
      
      // If no match, try matching by slug (handles variations like "Modiin" vs "Modi'in")
      if (!cityData) {
        const normalizedSlug = normalizeToSlug(cityName);
        const { data: slugMatch, error: slugError } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', normalizedSlug)
          .maybeSingle();
        
        if (slugMatch) {
          cityData = slugMatch;
        }
      }
      
      if (!cityData) {
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
