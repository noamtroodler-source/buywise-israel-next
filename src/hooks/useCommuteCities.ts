import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isSavedLocationDest } from '@/lib/utils/commuteFilter';

export type CommuteDestination = 'tel_aviv' | 'jerusalem';

export function useCommuteCities(
  destination: CommuteDestination | null | undefined,
  maxMinutes: number | null | undefined,
) {
  return useQuery({
    queryKey: ['commute-cities', destination, maxMinutes],
    queryFn: async () => {
      if (!destination || !maxMinutes || isSavedLocationDest(destination)) return null;

      const column =
        destination === 'tel_aviv'
          ? 'commute_time_tel_aviv'
          : 'commute_time_jerusalem';

      const { data, error } = await supabase
        .from('cities')
        .select('name')
        .not(column, 'is', null)
        .lte(column, maxMinutes);

      if (error) throw error;
      return (data ?? []).map((c) => c.name);
    },
    enabled: !!destination && !!maxMinutes,
    staleTime: 5 * 60 * 1000, // 5 min – city data rarely changes
  });
}
