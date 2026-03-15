import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NationalAverageYear {
  year: number;
  avg_price: number;
  city_count: number;
}

/**
 * Fetches national average prices from the country_avg column in city_price_history.
 * Uses rooms=0 (all-rooms aggregate) to avoid double-counting per-room-type rows.
 * The country_avg column contains the CBS national average directly.
 */
export function useNationalAveragePrices() {
  return useQuery({
    queryKey: ['national-average-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_price_history')
        .select('year, quarter, country_avg, city_en')
        .eq('rooms', 0)
        .not('country_avg', 'is', null)
        .order('year', { ascending: true });

      if (error) throw error;

      // Group by year: use the country_avg column (CBS national average)
      // Deduplicate: country_avg is the same across all cities for a given quarter
      const byYear = new Map<number, { quarterValues: Map<number, number>; cityCount: Set<string> }>();
      for (const row of (data || [])) {
        if (!row.country_avg) continue;
        const existing = byYear.get(row.year) || { quarterValues: new Map(), cityCount: new Set() };
        // Only store one country_avg per quarter (they're identical across cities)
        if (!existing.quarterValues.has(row.quarter)) {
          existing.quarterValues.set(row.quarter, row.country_avg);
        }
        existing.cityCount.add(row.city_en);
        byYear.set(row.year, existing);
      }

      const result: NationalAverageYear[] = [];
      for (const [year, entry] of byYear) {
        const values = [...entry.quarterValues.values()];
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        result.push({
          year,
          avg_price: avg,
          city_count: entry.cityCount.size,
        });
      }

      return result.sort((a, b) => a.year - b.year);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
