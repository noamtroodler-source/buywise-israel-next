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

// Convert slug to city name format (e.g., 'tel-aviv' -> 'Tel Aviv')
function slugToCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useHistoricalPrices(citySlug: string, years: number = 10) {
  return useQuery({
    queryKey: ['historical-prices', citySlug, years],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;
      const cityName = slugToCityName(citySlug);

      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .eq('city', cityName)
        .gte('year', startYear)
        .order('year', { ascending: true });

      if (error) throw error;
      return data as HistoricalPrice[];
    },
    enabled: !!citySlug,
  });
}

export function useCityPriceComparison(citySlugs: string[], startYear: number, endYear: number) {
  return useQuery({
    queryKey: ['city-price-comparison', citySlugs, startYear, endYear],
    queryFn: async () => {
      const cityNames = citySlugs.map(slugToCityName);
      
      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .in('city', cityNames)
        .gte('year', startYear)
        .lte('year', endYear)
        .order('year', { ascending: true });

      if (error) throw error;
      return data as HistoricalPrice[];
    },
    enabled: citySlugs.length > 0,
  });
}

export function calculateCAGR(startPrice: number, endPrice: number, years: number): number {
  if (startPrice <= 0 || years <= 0) return 0;
  const cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
  return Math.round(cagr * 100) / 100;
}
