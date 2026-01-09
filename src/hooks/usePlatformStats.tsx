import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const [propertiesRes, citiesRes] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('cities').select('id', { count: 'exact', head: true })
      ]);
      
      return {
        propertyCount: propertiesRes.count || 0,
        cityCount: citiesRes.count || 0,
        toolCount: 9 // Static - matches actual tools available
      };
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
