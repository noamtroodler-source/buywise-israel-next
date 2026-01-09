import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSavesCount(propertyId: string) {
  return useQuery({
    queryKey: ['savesCount', propertyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
