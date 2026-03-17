import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedNeighborhood, PriceTier } from '@/types/neighborhood';

export interface NeighborhoodPriceRow {
  name: string;
  avg_price: number;
  yoy_change_percent: number | null;
  latest_year: number;
  latest_quarter: number;
  price_tier: PriceTier | null;
  is_featured: boolean;
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

      // 4. Group prices by anglo_name, averaging across multiple CBS zones
      const neighborhoodPrices = new Map<string, {
        latestPrices: number[];
        prevPrices: number[];
        latestYear: number;
        latestQuarter: number;
      }>();

      for (const mapping of typedMappings) {
        const prices = (priceData || []).filter(
          (p: any) => p.neighborhood_id === mapping.cbs_neighborhood_id
        );
        if (prices.length === 0) continue;

        const latest = prices[0] as any;
        const existing = neighborhoodPrices.get(mapping.anglo_name);

        if (!existing) {
          const prevYear = prices.find(
            (p: any) => p.year === latest.year - 1 && p.quarter === latest.quarter
          ) as any;

          neighborhoodPrices.set(mapping.anglo_name, {
            latestPrices: [latest.avg_price_nis],
            prevPrices: prevYear?.avg_price_nis ? [prevYear.avg_price_nis] : [],
            latestYear: latest.year,
            latestQuarter: latest.quarter,
          });
        } else {
          existing.latestPrices.push(latest.avg_price_nis);
          const prevYear = prices.find(
            (p: any) => p.year === latest.year - 1 && p.quarter === latest.quarter
          ) as any;
          if (prevYear?.avg_price_nis) existing.prevPrices.push(prevYear.avg_price_nis);
        }
      }

      // 5. Build final rows
      const rows: NeighborhoodPriceRow[] = [];
      for (const [name, data] of neighborhoodPrices) {
        const avgPrice = Math.round(
          data.latestPrices.reduce((s, v) => s + v, 0) / data.latestPrices.length
        );
        if (!avgPrice) continue;

        let yoyChange: number | null = null;
        if (data.prevPrices.length > 0) {
          const avgPrev = data.prevPrices.reduce((s, v) => s + v, 0) / data.prevPrices.length;
          if (avgPrev > 0) {
            yoyChange = Math.round(((avgPrice - avgPrev) / avgPrev) * 1000) / 10;
          }
        }

        const feat = featuredMap.get(name);
        rows.push({
          name,
          avg_price: avgPrice,
          yoy_change_percent: yoyChange,
          latest_year: data.latestYear,
          latest_quarter: data.latestQuarter,
          price_tier: feat?.price_tier ?? null,
          is_featured: !!feat,
        });
      }

      // Default sort: price descending
      rows.sort((a, b) => b.avg_price - a.avg_price);
      return rows;
    },
    enabled: !!cityName && !!citySlug,
    staleTime: 10 * 60 * 1000,
  });
}
