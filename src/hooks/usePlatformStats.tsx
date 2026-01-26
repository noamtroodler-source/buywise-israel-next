import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const [forSaleRes, rentalsRes, projectsRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
          .eq('listing_status', 'for_sale'),
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
          .eq('listing_status', 'for_rent'),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
      ]);
      
      return {
        forSaleCount: forSaleRes.count || 0,
        rentalsCount: rentalsRes.count || 0,
        projectsCount: projectsRes.count || 0
      };
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
