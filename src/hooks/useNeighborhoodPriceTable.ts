import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedNeighborhood, PriceTier } from '@/types/neighborhood';
import { combineNeighborhoodSnapshots, computeNeighborhoodSnapshot, type NeighborhoodQuarterPrice } from '@/lib/neighborhoodPriceStats';

export interface NeighborhoodPriceRow {
  name: string;
  avg_price: number;
  yoy_change_percent: number | null;
  yoy_warning: boolean;
  latest_year: number;
  latest_quarter: number;
  price_tier: PriceTier | null;
  is_featured: boolean;
  is_fallback: boolean;
}

const CBS_CITY_VARIANTS: Record<string, string> = {
  "Ma'ale Adumim": "Maale Adumim",
  "Modi'in": "Modiin",
  "Ra'anana": "Raanana",
  "Maale Adumim": "Ma'ale Adumim",
  "Modiin": "Modi'in",
  "Raanana": "Ra'anana",
};

export function useNeighborhoodPriceTable(citySlug: string, cityName: string | undefined) {
  return useQuery({
    queryKey: ['neighborhoodPriceTable', citySlug, cityName],
    queryFn: async (): Promise<NeighborhoodPriceRow[]> => {
      if (!cityName) return [];

      // 1. Get featured neighborhoods for cross-reference
      const { data: cityData } = await supabase
        .from('cities')
        .select('featured_neighborhoods')
        .eq('slug', citySlug)
        .maybeSingle();

      const featured: FeaturedNeighborhood[] = Array.isArray(cityData?.featured_neighborhoods)
        ? (cityData.featured_neighborhoods as unknown as FeaturedNeighborhood[])
        : [];
      const featuredMap = new Map(featured.map(f => [f.name, f]));

      // 2. Get all approved CBS mappings for this city
      const cbsVariants = [cityName];
      if (CBS_CITY_VARIANTS[cityName]) cbsVariants.push(CBS_CITY_VARIANTS[cityName]);

      const { data: mappings, error: mappingsErr } = await supabase
        .from('neighborhood_cbs_mappings' as any)
        .select('anglo_name, cbs_neighborhood_id, city')
        .in('city', cbsVariants)
        .eq('status', 'approved');

      if (mappingsErr) throw mappingsErr;
      if (!mappings || mappings.length === 0) return [];

      const typedMappings = mappings as unknown as Array<{
        anglo_name: string;
        cbs_neighborhood_id: string;
        city: string;
      }>;

      // 3. Get price data for all mapped CBS IDs
      const cbsIds = [...new Set(typedMappings.map(m => m.cbs_neighborhood_id))];
      const cbsCity = typedMappings[0].city;

      const { data: priceData, error: priceErr } = await supabase
        .from('neighborhood_price_history')
        .select('neighborhood_id, avg_price_nis, year, quarter, rooms')
        .in('neighborhood_id', cbsIds)
        .eq('city_en', cbsCity)
        .eq('rooms', 4)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(1000);

      if (priceErr) throw priceErr;

      // 4. Group prices by anglo_name, blending multiple mapped zones with smoothed stats
      const neighborhoodPrices = new Map<string, ReturnType<typeof combineNeighborhoodSnapshots>>();
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

        neighborhoodPrices.set(angloName, combineNeighborhoodSnapshots(snapshots));
      }

      // 5. Build final rows
      const rows: NeighborhoodPriceRow[] = [];
      for (const [name, data] of neighborhoodPrices) {
        const avgPrice = data.currentAvgPrice;
        if (avgPrice == null || data.latestYear == null || data.latestQuarter == null) continue;

        const feat = featuredMap.get(name);
        rows.push({
          name,
          avg_price: avgPrice,
          yoy_change_percent: data.yoyChangePercent,
          yoy_warning: data.yoyWarning,
          latest_year: data.latestYear,
          latest_quarter: data.latestQuarter,
          price_tier: feat?.price_tier ?? null,
          is_featured: !!feat,
          is_fallback: false, // will be set after all rows are built
        });
      }

      // Detect fallback rows: if 3+ neighborhoods share the exact same price,
      // they're likely using city-average fallback data
      const priceCount = new Map<number, number>();
      for (const row of rows) {
        priceCount.set(row.avg_price, (priceCount.get(row.avg_price) || 0) + 1);
      }
      for (const row of rows) {
        row.is_fallback = (priceCount.get(row.avg_price) || 0) >= 3;
      }

      // Default sort: price descending
      rows.sort((a, b) => b.avg_price - a.avg_price);
      return rows;
    },
    enabled: !!cityName && !!citySlug,
    staleTime: 10 * 60 * 1000,
  });
}
