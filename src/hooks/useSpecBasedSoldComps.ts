/**
 * useSpecBasedSoldComps
 *
 * Fallback for listings with no coordinates (no-address sourced listings).
 * Finds recently sold comparable properties by spec matching:
 *   - Same city (or neighborhood if available)
 *   - Similar bedrooms (±1)
 *   - Similar size (±25%)
 *   - Sold within last 18 months
 *
 * Used in place of the geography-based useNearbySoldComps when
 * latitude/longitude are not available.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpecBasedComp {
  id: string;
  sold_price: number;
  sold_date: string;
  rooms: number | null;
  size_sqm: number | null;
  price_per_sqm: number | null;
  neighborhood: string | null;
  property_type: string | null;
}

interface UseSpecBasedSoldCompsOptions {
  monthsBack?: number;
  limit?: number;
  enabled?: boolean;
}

export function useSpecBasedSoldComps(
  city: string,
  bedrooms: number | null | undefined,
  sizeSqm: number | null | undefined,
  neighborhood?: string | null,
  sourceRooms?: number | null, // Israeli room count from source site
  options: UseSpecBasedSoldCompsOptions = {}
) {
  const { monthsBack = 18, limit = 6, enabled = true } = options;

  return useQuery({
    queryKey: ['spec-based-sold-comps', city, bedrooms, sizeSqm, neighborhood, sourceRooms, monthsBack, limit],
    queryFn: async (): Promise<SpecBasedComp[]> => {
      if (!city) return [];

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

      let query = supabase
        .from('sold_transactions')
        .select('id, sold_price, sold_date, rooms, size_sqm, price_per_sqm, neighborhood, address, property_type')
        .ilike('city', `%${city}%`)
        .gte('sold_date', cutoffDate.toISOString().split('T')[0])
        .not('sold_price', 'is', null)
        .gt('sold_price', 0)
        .order('sold_date', { ascending: false })
        .limit(limit * 3); // fetch more, filter in JS

      // Filter by rooms — prefer source_rooms (Israeli count) for accuracy
      // source_rooms = exact Israeli room count as scraped (e.g. 4 for "4 חדרים")
      // bedrooms = source_rooms - 1 (our Western count)
      const israeliRooms = sourceRooms ?? (bedrooms != null ? bedrooms + 1 : null);
      if (israeliRooms != null) {
        query = query
          .gte('rooms', israeliRooms - 1)
          .lte('rooms', israeliRooms + 1);
      }

      // Filter by size if available
      if (sizeSqm && sizeSqm > 0) {
        const margin = sizeSqm * 0.25;
        query = query
          .gte('size_sqm', sizeSqm - margin)
          .lte('size_sqm', sizeSqm + margin);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Prefer same neighborhood if available
      const results = (data ?? []) as SpecBasedComp[];
      if (neighborhood && results.length > 3) {
        const sameNeighborhood = results.filter(
          (r) => r.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase())
        );
        if (sameNeighborhood.length >= 2) {
          // Mix: 2/3 same neighborhood + 1/3 city-wide for context
          const cityWide = results.filter(
            (r) => !r.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase())
          );
          return [...sameNeighborhood.slice(0, 4), ...cityWide.slice(0, 2)].slice(0, limit);
        }
      }

      return results.slice(0, limit);
    },
    enabled: enabled && !!city,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Computes summary stats from spec-based comps for display.
 */
export function computeSpecCompStats(comps: Array<{ price_per_sqm: number | null }>, subjectPriceSqm?: number | null) {
  const validComps = comps.filter((c) => c.price_per_sqm && c.price_per_sqm > 0);
  if (validComps.length === 0) return null;

  const pricesPerSqm = validComps.map((c) => c.price_per_sqm!);
  const avg = pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length;
  const min = Math.min(...pricesPerSqm);
  const max = Math.max(...pricesPerSqm);

  let vsSubject: number | null = null;
  if (subjectPriceSqm && subjectPriceSqm > 0) {
    vsSubject = ((subjectPriceSqm - avg) / avg) * 100;
  }

  return {
    avgPriceSqm: Math.round(avg),
    minPriceSqm: Math.round(min),
    maxPriceSqm: Math.round(max),
    count: validComps.length,
    vsSubjectPct: vsSubject ? Math.round(vsSubject) : null,
  };
}
