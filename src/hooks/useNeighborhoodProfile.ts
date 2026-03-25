import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NeighborhoodProfile {
  id: string;
  city: string;
  neighborhood: string;
  reputation: string | null;
  physical_character: string | null;
  proximity_anchors: string | null;
  anglo_community: string | null;
  daily_life: string | null;
  transit_mobility: string | null;
  honest_tradeoff: string | null;
  best_for: string | null;
  narrative: string | null;
  sources: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Normalize a property's neighborhood string to match the curated roster.
 * Handles patterns like "Old North - North" → "Old North",
 * "Lev Tel Aviv, Lev HaIr North" → "Lev Tel Aviv" then "Lev HaIr"
 */
function getCandidateNames(neighborhood: string): string[] {
  const candidates: string[] = [neighborhood.trim()];

  // Split on comma → try first segment
  if (neighborhood.includes(',')) {
    candidates.push(neighborhood.split(',')[0].trim());
  }

  // Split on " - " → try first segment
  if (neighborhood.includes(' - ')) {
    candidates.push(neighborhood.split(' - ')[0].trim());
  }

  // Dedupe
  return [...new Set(candidates)];
}

export function useNeighborhoodProfile(city: string | undefined, neighborhood: string | undefined | null) {
  return useQuery({
    queryKey: ['neighborhoodProfile', city, neighborhood],
    queryFn: async () => {
      if (!city || !neighborhood) return null;

      const candidates = getCandidateNames(neighborhood);

      // Try exact match first (case-insensitive), then candidates
      for (const name of candidates) {
        const { data, error } = await supabase
          .from('neighborhood_profiles')
          .select('*')
          .ilike('city', city)
          .ilike('neighborhood', name)
          .maybeSingle();

        if (error) throw error;
        if (data) return data as NeighborhoodProfile;
      }

      // Fallback: try partial match with the first candidate
      const { data, error } = await supabase
        .from('neighborhood_profiles')
        .select('*')
        .ilike('city', city)
        .ilike('neighborhood', `%${candidates[0]}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as NeighborhoodProfile | null;
    },
    enabled: !!city && !!neighborhood,
    staleTime: 10 * 60 * 1000,
  });
}
