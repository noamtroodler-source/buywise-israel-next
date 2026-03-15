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

/** Strip apostrophes to match city_price_history naming (e.g. "Raanana" not "Ra'anana") */
function normalizeCityName(name: string): string {
  return name.replace(/['']/g, '');
}

// Convert slug to city name format (e.g., 'tel-aviv' -> 'Tel Aviv')
function slugToCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetches historical prices from city_price_history table.
 * Uses rooms=0 (CBS all-rooms aggregate) and averages quarterly data into yearly values.
 */
export function useHistoricalPrices(citySlug: string, years?: number) {
  return useQuery({
    queryKey: ['historical-prices', citySlug, years],
    queryFn: async () => {
      const { data: cityData } = await supabase
        .from('cities')
        .select('name')
        .eq('slug', citySlug)
        .maybeSingle();

      const cityName = normalizeCityName(cityData?.name || slugToCityName(citySlug));

      let query = supabase
        .from('city_price_history')
        .select('*')
        .eq('city_en', cityName)
        .eq('rooms', 0) // all-rooms aggregate only
        .order('year', { ascending: true })
        .order('quarter', { ascending: true });

      if (years) {
        const currentYear = new Date().getFullYear();
        query = query.gte('year', currentYear - years);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group quarterly data into yearly averages
      const yearMap = new Map<number, number[]>();
      for (const row of (data || [])) {
        if (!row.avg_price_nis) continue;
        const arr = yearMap.get(row.year) || [];
        arr.push(row.avg_price_nis);
        yearMap.set(row.year, arr);
      }

      const result: HistoricalPrice[] = [];
      const sortedYears = [...yearMap.keys()].sort((a, b) => a - b);

      for (let i = 0; i < sortedYears.length; i++) {
        const year = sortedYears[i];
        const prices = yearMap.get(year)!;
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

        let yoyChange: number | null = null;
        if (i > 0) {
          const prevPrices = yearMap.get(sortedYears[i - 1])!;
          const prevAvg = prevPrices.reduce((a, b) => a + b, 0) / prevPrices.length;
          if (prevAvg > 0) {
            yoyChange = Math.round(((avgPrice - prevAvg) / prevAvg) * 1000) / 10;
          }
        }

        result.push({
          id: `${cityName}-${year}`,
          city: cityName,
          year,
          average_price: avgPrice,
          average_price_sqm: null,
          yoy_change_percent: yoyChange,
          transaction_count: null,
          notes: null,
        });
      }

      return result;
    },
    enabled: !!citySlug,
  });
}

export function useCityPriceComparison(citySlugs: string[], startYear: number, endYear: number) {
  return useQuery({
    queryKey: ['city-price-comparison', citySlugs, startYear, endYear],
    queryFn: async () => {
      const { data: citiesData } = await supabase
        .from('cities')
        .select('name, slug')
        .in('slug', citySlugs);

      const slugToName = new Map<string, string>();
      for (const c of (citiesData || [])) {
        slugToName.set(c.slug, c.name);
      }
      const cityNames = citySlugs.map(s => normalizeCityName(slugToName.get(s) || slugToCityName(s)));

      const { data, error } = await supabase
        .from('city_price_history')
        .select('*')
        .in('city_en', cityNames)
        .eq('rooms', 0)
        .gte('year', startYear)
        .lte('year', endYear)
        .order('year', { ascending: true });

      if (error) throw error;

      const grouped = new Map<string, number[]>();
      for (const row of (data || [])) {
        if (!row.avg_price_nis) continue;
        const key = `${row.city_en}-${row.year}`;
        const arr = grouped.get(key) || [];
        arr.push(row.avg_price_nis);
        grouped.set(key, arr);
      }

      const result: HistoricalPrice[] = [];
      for (const [key, prices] of grouped) {
        const [city, yearStr] = [key.substring(0, key.lastIndexOf('-')), key.substring(key.lastIndexOf('-') + 1)];
        result.push({
          id: key,
          city,
          year: parseInt(yearStr),
          average_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          average_price_sqm: null,
          yoy_change_percent: null,
          transaction_count: null,
          notes: null,
        });
      }

      return result.sort((a, b) => a.year - b.year);
    },
    enabled: citySlugs.length > 0,
  });
}

export function useHistoricalPriceComparison(cityNames: string[]) {
  return useQuery({
    queryKey: ['historical-price-comparison', cityNames],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_price_history')
        .select('*')
        .in('city_en', cityNames.map(normalizeCityName))
        .eq('rooms', 0)
        .order('year', { ascending: true });

      if (error) throw error;

      const grouped = new Map<string, number[]>();
      for (const row of (data || [])) {
        if (!row.avg_price_nis) continue;
        const key = `${row.city_en}-${row.year}`;
        const arr = grouped.get(key) || [];
        arr.push(row.avg_price_nis);
        grouped.set(key, arr);
      }

      const result: HistoricalPrice[] = [];
      for (const [key, prices] of grouped) {
        const [city, yearStr] = [key.substring(0, key.lastIndexOf('-')), key.substring(key.lastIndexOf('-') + 1)];
        result.push({
          id: key,
          city,
          year: parseInt(yearStr),
          average_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          average_price_sqm: null,
          yoy_change_percent: null,
          transaction_count: null,
          notes: null,
        });
      }

      return result.sort((a, b) => a.year - b.year);
    },
    enabled: cityNames.length > 0,
  });
}

export function calculateCAGR(startPrice: number, endPrice: number, years: number): number {
  if (startPrice <= 0 || years <= 0) return 0;
  const cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
  return Math.round(cagr * 100) / 100;
}
