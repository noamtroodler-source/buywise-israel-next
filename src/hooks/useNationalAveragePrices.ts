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
        .from('historical_prices')
        .select('year, average_price')
        .not('average_price', 'is', null)
        .order('year', { ascending: true });

      if (error) throw error;

      // Group by year and compute average
      const byYear = new Map<number, number[]>();
      for (const row of data) {
        if (!row.average_price) continue;
        const arr = byYear.get(row.year) || [];
        arr.push(row.average_price);
        byYear.set(row.year, arr);
      }

      const result: NationalAverageYear[] = [];
      for (const [year, prices] of byYear) {
        result.push({
          year,
          avg_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          city_count: prices.length,
        });
      }

      return result.sort((a, b) => a.year - b.year);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
