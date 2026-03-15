import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoomComparisonDataPoint {
  year: number;
  quarter: number;
  label: string;
  [cityKey: string]: number | string | null;
}

function normalizeCityName(name: string): string {
  return name.replace(/['']/g, '');
}

/**
 * Fetches price data for a specific room type across multiple cities.
 * Returns chart data with one key per city slug.
 */
export function useRoomPriceComparison(
  citySlugs: string[],
  roomType: number,
) {
  return useQuery({
    queryKey: ['room-price-comparison', citySlugs, roomType],
    queryFn: async () => {
      if (citySlugs.length === 0) return { chartData: [], cityNames: {} };

      // Resolve slugs → names
      const { data: citiesData } = await supabase
        .from('cities')
        .select('name, slug')
        .in('slug', citySlugs);

      const slugToName: Record<string, string> = {};
      const nameToSlug: Record<string, string> = {};
      for (const c of citiesData || []) {
        const normalized = normalizeCityName(c.name);
        slugToName[c.slug] = c.name;
        nameToSlug[normalized] = c.slug;
      }

      const normalizedNames = citySlugs.map(
        (s) => normalizeCityName(slugToName[s] || s),
      );

      const { data, error } = await supabase
        .from('city_price_history')
        .select('*')
        .in('city_en', normalizedNames)
        .eq('rooms', roomType)
        .order('year', { ascending: true })
        .order('quarter', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return { chartData: [], cityNames: slugToName };

      // Group by year+quarter
      const grouped = new Map<string, RoomComparisonDataPoint>();
      for (const row of data) {
        if (!row.avg_price_nis) continue;
        const key = `${row.year}-Q${row.quarter}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            year: row.year,
            quarter: row.quarter,
            label: `Q${row.quarter} ${row.year}`,
          });
        }
        const point = grouped.get(key)!;
        const slug = nameToSlug[row.city_en];
        if (slug) {
          point[slug] = row.avg_price_nis;
        }
      }

      const chartData = [...grouped.values()].sort(
        (a, b) => (a.year as number) - (b.year as number) || (a.quarter as number) - (b.quarter as number),
      );

      return { chartData, cityNames: slugToName };
    },
    enabled: citySlugs.length > 0 && roomType > 0,
  });
}
