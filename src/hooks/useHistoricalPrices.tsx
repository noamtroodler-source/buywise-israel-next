import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricalPrice {
  id: string;
  city: string;
  year: number;
  average_price: number | null;
  average_price_sqm: number | null;
  yoy_change_percent: number | null;
  transaction_count: number | null;
  notes: string | null;
}

export function useHistoricalPrices(city: string, years: number = 10) {
  return useQuery({
    queryKey: ['historical-prices', city, years],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;

      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .eq('city', city)
        .gte('year', startYear)
        .order('year', { ascending: true });

      if (error) throw error;
      return data as HistoricalPrice[];
    },
    enabled: !!city,
  });
}

export function useCityPriceComparison(cities: string[], startYear: number, endYear: number) {
  return useQuery({
    queryKey: ['city-price-comparison', cities, startYear, endYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .in('city', cities)
        .gte('year', startYear)
        .lte('year', endYear)
        .order('year', { ascending: true });

      if (error) throw error;
      return data as HistoricalPrice[];
    },
    enabled: cities.length > 0,
  });
}

export function calculateCAGR(startPrice: number, endPrice: number, years: number): number {
  if (startPrice <= 0 || years <= 0) return 0;
  const cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
  return Math.round(cagr * 100) / 100;
}
