import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CityMarketFactor {
  id: string;
  city_slug: string;
  title: string;
  description: string;
  icon: 'transit' | 'development' | 'policy' | 'infrastructure' | 'zoning';
  timing: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function useCityMarketFactors(citySlug: string) {
  return useQuery({
    queryKey: ['city-market-factors', citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_market_factors')
        .select('*')
        .eq('city_slug', citySlug)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as CityMarketFactor[];
    },
    enabled: !!citySlug,
  });
}
