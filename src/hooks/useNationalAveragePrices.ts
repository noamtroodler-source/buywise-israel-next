import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NationalAverageYear {
  year: number;
  avg_price: number;
  city_count: number;
}

export function useNationalAveragePrices() {
  return useQuery({
    queryKey: ['national-average-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_price_history')
        .select('year, avg_price_nis, city_en')
        .not('avg_price_nis', 'is', null)
        .order('year', { ascending: true });

      if (error) throw error;

      // Group by year: average across all cities
      const byYear = new Map<number, { prices: number[]; cities: Set<string> }>();
      for (const row of (data || [])) {
        if (!row.avg_price_nis) continue;
        const existing = byYear.get(row.year) || { prices: [], cities: new Set() };
        existing.prices.push(row.avg_price_nis);
        existing.cities.add(row.city_en);
        byYear.set(row.year, existing);
      }

      const result: NationalAverageYear[] = [];
      for (const [year, entry] of byYear) {
        result.push({
          year,
          avg_price: Math.round(entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length),
          city_count: entry.cities.size,
        });
      }

      return result.sort((a, b) => a.year - b.year);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
