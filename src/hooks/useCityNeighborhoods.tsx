import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedNeighborhood } from '@/types/neighborhood';
import { useNeighborhoodPrices } from '@/hooks/useNeighborhoodPrices';

export function useCityNeighborhoods(citySlug: string) {
  const neighborhoodsQuery = useQuery({
    queryKey: ['cityNeighborhoods', citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('featured_neighborhoods, name')
        .eq('slug', citySlug)
        .maybeSingle();

      if (error) throw error;
      
      const rawNeighborhoods = data?.featured_neighborhoods;
      const neighborhoods: FeaturedNeighborhood[] = Array.isArray(rawNeighborhoods) 
        ? rawNeighborhoods as unknown as FeaturedNeighborhood[]
        : [];
      
      return {
        neighborhoods: neighborhoods.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
        cityName: data?.name || '',
      };
    },
    enabled: !!citySlug,
  });

  const cityName = neighborhoodsQuery.data?.cityName;
  const { data: priceData } = useNeighborhoodPrices(cityName);

  // Merge price data into neighborhoods
  const enrichedNeighborhoods = neighborhoodsQuery.data?.neighborhoods.map(n => ({
    ...n,
    avg_price: priceData?.[n.name]?.avg_price ?? n.avg_price,
    yoy_change_percent: priceData?.[n.name]?.yoy_change_percent ?? n.yoy_change_percent,
  })) || [];

  return {
    ...neighborhoodsQuery,
    data: enrichedNeighborhoods,
  };
}
