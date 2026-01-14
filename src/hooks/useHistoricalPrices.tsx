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

export function useHistoricalPrices(citySlug: string, years?: number) {
  return useQuery({
    queryKey: ['historical-prices', citySlug, years],
    queryFn: async () => {
      const cityName = slugToCityName(citySlug);

      let query = supabase
        .from('historical_prices')
        .select('*')
        .eq('city', cityName)
        .order('year', { ascending: true });

      // Only filter by year if explicitly requested
      if (years) {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - years;
        query = query.gte('year', startYear);
      }

      const { data, error } = await query;
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

// Hook for fetching historical prices for multiple cities (for All Time comparison)
export function useHistoricalPriceComparison(cityNames: string[]) {
  return useQuery({
    queryKey: ['historical-price-comparison', cityNames],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .in('city', cityNames)
        .order('year', { ascending: true });

      if (error) throw error;
      return data as HistoricalPrice[];
    },
    enabled: cityNames.length > 0,
  });
}

export function calculateCAGR(startPrice: number, endPrice: number, years: number): number {
  if (startPrice <= 0 || years <= 0) return 0;
  const cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
  return Math.round(cagr * 100) / 100;
}
