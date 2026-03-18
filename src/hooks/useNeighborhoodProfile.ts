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
  sources: string | null;
  created_at: string;
  updated_at: string;
}

export function useNeighborhoodProfile(city: string | undefined, neighborhood: string | undefined | null) {
  return useQuery({
    queryKey: ['neighborhoodProfile', city, neighborhood],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhood_profiles')
        .select('*')
        .eq('city', city!)
        .eq('neighborhood', neighborhood!)
        .maybeSingle();

      if (error) throw error;
      return data as NeighborhoodProfile | null;
    },
    enabled: !!city && !!neighborhood,
    staleTime: 10 * 60 * 1000,
  });
}
