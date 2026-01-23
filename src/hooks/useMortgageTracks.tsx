import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MortgageTrack {
  id: string;
  track_type: string;
  hebrew_name: string;
  english_name: string;
  description: string | null;
  is_cpi_linked: boolean | null;
  current_rate_min: number | null;
  current_rate_max: number | null;
  boi_limit_percent: number | null;
  risk_level: string | null;
  best_use_case: string | null;
  prepayment_penalty: string | null;
  foreign_buyer_notes: string | null;
}

export function useMortgageTracks() {
  return useQuery({
    queryKey: ['mortgage-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mortgage_tracks')
        .select('*')
        .order('track_type');

      if (error) throw error;
      return data as MortgageTrack[];
    },
  });
}

export function useMortgageTrack(trackType: string) {
  return useQuery({
    queryKey: ['mortgage-track', trackType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mortgage_tracks')
        .select('*')
        .eq('track_type', trackType)
        .maybeSingle();
      
      if (!data) throw new Error('Mortgage track not found');

      if (error) throw error;
      return data as MortgageTrack;
    },
    enabled: !!trackType,
  });
}
