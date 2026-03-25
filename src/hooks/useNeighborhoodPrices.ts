import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { combineNeighborhoodSnapshots, computeNeighborhoodSnapshot, type NeighborhoodQuarterPrice } from '@/lib/neighborhoodPriceStats';

export interface NeighborhoodPriceData {
  avg_price: number | null;
  avg_price_sqm: number | null;
  yoy_change_percent: number | null;
  yoy_warning: boolean;
  latest_year: number | null;
  latest_quarter: number | null;
}

const AVG_SIZE_BY_ROOMS: Record<number, number> = {
  3: 75,
  4: 100,
  5: 130,
};

/**
 * Fetches approved CBS mappings for a city and joins with latest price data.
 * Returns price data keyed by anglo_name for easy lookup.
 * @param rooms - Israeli government standard total room count (bedrooms + additional rooms).
 *   Use getIsraeliRoomCount() from '@/lib/israeliRoomCount' to convert BuyWise fields.
 *   Supported: 3, 4, or 5. Defaults to 4.
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

      // Step 3: Group by neighborhood and compute smoothed, outlier-resistant stats
      const avgSize = AVG_SIZE_BY_ROOMS[effectiveRooms] || 100;

      const result: Record<string, NeighborhoodPriceData> = {};
      const mappingsByNeighborhood = new Map<string, string[]>();

      for (const mapping of typedMappings) {
        const existingIds = mappingsByNeighborhood.get(mapping.anglo_name) || [];
        if (!existingIds.includes(mapping.cbs_neighborhood_id)) {
          existingIds.push(mapping.cbs_neighborhood_id);
        }
        mappingsByNeighborhood.set(mapping.anglo_name, existingIds);
      }

      for (const [angloName, zoneIds] of mappingsByNeighborhood.entries()) {
        const snapshots = zoneIds.map((zoneId) => {
          const prices = (priceData || []).filter(
            (p: any) => p.neighborhood_id === zoneId
          ) as NeighborhoodQuarterPrice[];

          return computeNeighborhoodSnapshot(prices);
        });

        const combined = combineNeighborhoodSnapshots(snapshots);

        if (combined.currentAvgPrice == null) {
          result[angloName] = {
            avg_price: null,
            avg_price_sqm: null,
            yoy_change_percent: null,
            yoy_warning: false,
            latest_year: null,
            latest_quarter: null,
          };
          continue;
        }

        result[angloName] = {
          avg_price: combined.currentAvgPrice,
          avg_price_sqm: Math.round(combined.currentAvgPrice / avgSize),
          yoy_change_percent: combined.yoyChangePercent,
          yoy_warning: combined.yoyWarning,
          latest_year: combined.latestYear,
          latest_quarter: combined.latestQuarter,
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
 * @param rooms - Israeli government standard total room count (bedrooms + additional rooms).
 *   Use getIsraeliRoomCount() from '@/lib/israeliRoomCount' to convert BuyWise fields.
 *   Defaults to 4.
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
