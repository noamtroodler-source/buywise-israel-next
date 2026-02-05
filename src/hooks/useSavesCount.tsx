import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSavesCount(propertyId: string) {
  return useQuery({
    queryKey: ['savesCount', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_property_saves_count', { p_property_id: propertyId });

      if (error) throw error;
      return data ?? 0;
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
