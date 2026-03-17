import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VerificationRow {
  city_slug: string;
  room_count: number;
  rent_min: number | null;
  rent_max: number | null;
  rent_avg: number | null;
  yield_min: number | null;
  yield_max: number | null;
  source: string;
  verified_at: string;
  status: string;
  notes: string | null;
}

export interface CityVerificationData {
  yieldRow: VerificationRow | null;
  rental4Room: VerificationRow | null;
  sources: string;
  verifiedAt: string | null;
}

export function useCityVerification(citySlug: string | undefined) {
  return useQuery({
    queryKey: ['city-verification', citySlug],
    queryFn: async (): Promise<CityVerificationData> => {
      const { data, error } = await supabase
        .from('city_rental_verification')
        .select('*')
        .eq('city_slug', citySlug!)
        .in('room_count', [0, 4]);

      if (error) throw error;

      const rows = (data || []) as VerificationRow[];
      const yieldRow = rows.find(r => r.room_count === 0) || null;
      const rental4Room = rows.find(r => r.room_count === 4) || null;

      // Deduplicate sources
      const allSources = new Set<string>();
      rows.forEach(r => {
        r.source.split(',').map(s => s.trim()).forEach(s => allSources.add(s));
      });

      return {
        yieldRow,
        rental4Room,
        sources: Array.from(allSources).join(', '),
        verifiedAt: yieldRow?.verified_at || rental4Room?.verified_at || null,
      };
    },
    enabled: !!citySlug,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
