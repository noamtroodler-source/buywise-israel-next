import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCityPropertyCount(cityName: string | undefined) {
  return useQuery({
    queryKey: ['city-property-count', cityName],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('city', cityName!)
        .eq('is_published', true);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!cityName,
  });
}
