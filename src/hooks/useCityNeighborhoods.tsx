import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedNeighborhood } from '@/types/neighborhood';

export function useCityNeighborhoods(citySlug: string) {
  return useQuery({
    queryKey: ['cityNeighborhoods', citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('featured_neighborhoods')
        .eq('slug', citySlug)
        .maybeSingle();

      if (error) throw error;
      
      const rawNeighborhoods = data?.featured_neighborhoods;
      const neighborhoods: FeaturedNeighborhood[] = Array.isArray(rawNeighborhoods) 
        ? rawNeighborhoods as unknown as FeaturedNeighborhood[]
        : [];
      
      // Sort by sort_order
      return neighborhoods.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
    enabled: !!citySlug,
  });
}
