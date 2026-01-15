import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketData } from '@/types/projects';

export function useMarketData(city?: string) {
  return useQuery({
    queryKey: ['marketData', city],
    queryFn: async () => {
      let query = supabase
        .from('market_data')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketData[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - ensures fresh data on page load
  });
}

export function useCityComparison(cities: string[]) {
  return useQuery({
    queryKey: ['cityComparison', cities],
    queryFn: async () => {
      if (cities.length === 0) return [];

      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .in('city', cities)
        .eq('data_type', 'monthly')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) throw error;
      return data as MarketData[];
    },
    enabled: cities.length > 0,
  });
}

export function useLatestMarketData() {
  return useQuery({
    queryKey: ['latestMarketData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('data_type', 'monthly')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as MarketData[];
    },
  });
}
