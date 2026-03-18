import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NeighborhoodPriceData {
  anglo_name: string;
  cbs_neighborhood_id: string;
  avg_price: number | null;
  yoy_change_percent: number | null;
  latest_year: number | null;
  latest_quarter: number | null;
  rooms: number;
}

const AVG_SIZE_BY_ROOMS: Record<number, number> = {
  3: 75,
  4: 100,
  5: 130,
};

/**
 * Fetches approved CBS mappings for a city and joins with latest price data.
 * Returns price data keyed by anglo_name for easy lookup.
 * @param rooms - Room count to query (3, 4, or 5). Defaults to 4.
 */
export function useNeighborhoodPrices(cityName: string | undefined, rooms: number = 4) {
  // Clamp rooms to supported range
  const effectiveRooms = Math.max(3, Math.min(5, rooms));

  return useQuery({
    queryKey: ['neighborhoodPrices', cityName, effectiveRooms],
    queryFn: async () => {
      if (!cityName) return {};

      // Step 1: Get approved mappings for this city
      const cbsCityVariants = [cityName];
      const platformToCbs: Record<string, string> = {
        "Ma'ale Adumim": "Maale Adumim",
        "Modi'in": "Modiin",
        "Ra'anana": "Raanana",
      };
      if (platformToCbs[cityName]) {
        cbsCityVariants.push(platformToCbs[cityName]);
      }
      const cbsToPlatform: Record<string, string> = {
        "Maale Adumim": "Ma'ale Adumim",
        "Modiin": "Modi'in",
        "Raanana": "Ra'anana",
      };
      if (cbsToPlatform[cityName]) {
        cbsCityVariants.push(cbsToPlatform[cityName]);
      }

      const { data: mappings, error: mappingsErr } = await supabase
        .from('neighborhood_cbs_mappings' as any)
        .select('anglo_name, cbs_neighborhood_id, city')
        .in('city', cbsCityVariants)
        .eq('status', 'approved');

      if (mappingsErr) throw mappingsErr;
      if (!mappings || mappings.length === 0) return {};

      const typedMappings = mappings as unknown as Array<{
        anglo_name: string;
        cbs_neighborhood_id: string;
        city: string;
      }>;

      // Step 2: Get price data for all mapped CBS IDs
      const cbsIds = [...new Set(typedMappings.map(m => m.cbs_neighborhood_id))];
      const cbsCity = typedMappings[0].city;

      const { data: priceData, error: priceErr } = await supabase
        .from('neighborhood_price_history')
        .select('neighborhood_id, avg_price_nis, year, quarter, rooms')
        .in('neighborhood_id', cbsIds)
        .eq('city_en', cbsCity)
        .eq('rooms', effectiveRooms)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(500);

      if (priceErr) throw priceErr;

      // Step 3: For each mapping, find latest price and calculate 3-year change
      const avgSize = AVG_SIZE_BY_ROOMS[effectiveRooms] || 100;

      const result: Record<string, {
        avg_price: number | null;
        avg_price_sqm: number | null;
        yoy_change_percent: number | null;
        latest_year: number | null;
        latest_quarter: number | null;
      }> = {};

      for (const mapping of typedMappings) {
        const prices = (priceData || []).filter(
          (p: any) => p.neighborhood_id === mapping.cbs_neighborhood_id
        );

        if (prices.length === 0) {
          result[mapping.anglo_name] = {
            avg_price: null,
            avg_price_sqm: null,
            yoy_change_percent: null,
            latest_year: null,
            latest_quarter: null,
          };
          continue;
        }

        const latest = prices[0] as any;
        const latestYear = latest.year;
        const latestQuarter = latest.quarter;

        // Average last 4 quarters (1 year) for a stable benchmark
        const recentPrices = prices.slice(0, 4).filter((p: any) => p.avg_price_nis);
        const avgPrice = recentPrices.length > 0
          ? Math.round(recentPrices.reduce((sum: number, p: any) => sum + p.avg_price_nis, 0) / recentPrices.length)
          : null;

        // Compare against 3 years ago for a stable trend
        const prevYear = prices.find(
          (p: any) => p.year === latestYear - 3 && p.quarter === latestQuarter
        ) as any;

        const yoyChange = prevYear?.avg_price_nis && latest.avg_price_nis
          ? Math.round(((latest.avg_price_nis - prevYear.avg_price_nis) / prevYear.avg_price_nis) * 1000) / 10
          : null;

        result[mapping.anglo_name] = {
          avg_price: avgPrice,
          avg_price_sqm: avgPrice ? Math.round(avgPrice / avgSize) : null,
          yoy_change_percent: yoyChange,
          latest_year: latestYear,
          latest_quarter: latestQuarter,
        };
      }

      return result;
    },
    enabled: !!cityName,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetches neighborhood average price for a specific neighborhood in a city.
 * Used on property detail pages.
 * @param rooms - Room count for room-specific comparison (defaults to 4)
 */
export function useNeighborhoodAvgPrice(
  cityName: string | undefined,
  neighborhoodName: string | undefined,
  rooms: number = 4
) {
  const { data: allPrices, isLoading } = useNeighborhoodPrices(cityName, rooms);

  const priceData = neighborhoodName && allPrices ? allPrices[neighborhoodName] : null;

  return { data: priceData || null, isLoading };
}
