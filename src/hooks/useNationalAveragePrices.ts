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
      // Take the average of quarterly country_avg values per year
      const byYear = new Map<number, { values: number[]; cities: Set<string> }>();
      for (const row of (data || [])) {
        if (!row.country_avg) continue;
        const existing = byYear.get(row.year) || { values: [], cities: new Set<string>() };
        // Only add one country_avg per quarter (they're the same across cities)
        const quarterKey = `${row.year}-Q${row.quarter}`;
        if (!existing.cities.has(quarterKey)) {
          existing.values.push(row.country_avg);
          existing.cities.add(quarterKey);
        }
        // Track unique cities for the count
        existing.cities.add(row.city_en);
        byYear.set(row.year, existing);
      }

      const result: NationalAverageYear[] = [];
      for (const [year, entry] of byYear) {
        // Average the quarterly national values for this year
        const avg = Math.round(entry.values.reduce((a, b) => a + b, 0) / entry.values.length);
        result.push({
          year,
          avg_price: avg,
          city_count: entry.cities.size,
        });
      }

      return result.sort((a, b) => a.year - b.year);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
