import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';

export function useSimilarProperties(currentProperty: Property | null | undefined) {
  return useQuery({
    queryKey: ['similar-properties', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty) return [];

      const priceMin = currentProperty.price * 0.7;
      const priceMax = currentProperty.price * 1.3;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .eq('city', currentProperty.city)
        .eq('listing_status', currentProperty.listing_status)
        .gte('price', priceMin)
        .lte('price', priceMax)
        .neq('id', currentProperty.id)
        .limit(6);

      if (error) throw error;
      return (data || []) as Property[];
    },
    enabled: !!currentProperty?.id,
  });
}
