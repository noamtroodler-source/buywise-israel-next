import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Property } from '@/types/database';

interface UseToolPropertySuggestionsOptions {
  minPrice: number;
  maxPrice: number;
  city?: string;
  listingStatus?: 'for_sale' | 'for_rent';
  enabled?: boolean;
}

// Round to nearest 100K for stable query keys
function roundToNearest100K(value: number): number {
  return Math.round(value / 100000) * 100000;
}

export function useToolPropertySuggestions({
  minPrice,
  maxPrice,
  city,
  listingStatus = 'for_sale',
  enabled = true,
}: UseToolPropertySuggestionsOptions) {
  const stableMin = roundToNearest100K(minPrice);
  const stableMax = roundToNearest100K(maxPrice);

  return useQuery({
    queryKey: ['tool-property-suggestions', stableMin, stableMax, city || '', listingStatus],
    queryFn: async (): Promise<Property[]> => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .eq('listing_status', listingStatus)
        .gte('price', minPrice)
        .lte('price', maxPrice);

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data as unknown as Property[]) || [];
    },
    enabled: enabled && maxPrice > 0 && maxPrice > minPrice,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
