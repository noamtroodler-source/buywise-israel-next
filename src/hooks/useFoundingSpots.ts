import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FOUNDING_CAP = 15;

export function useFoundingSpots() {
  return useQuery({
    queryKey: ['founding-spots'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('founding_partners')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      const enrolled = count ?? 0;
      return { enrolled, remaining: Math.max(0, FOUNDING_CAP - enrolled), cap: FOUNDING_CAP };
    },
    staleTime: 30_000,
  });
}
