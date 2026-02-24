import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgencyTestimonial {
  id: string;
  agency_id: string;
  quote: string;
  author_name: string;
  author_context: string | null;
  service_used: string | null;
  display_order: number;
  created_at: string;
}

export function useAgencyTestimonials(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency-testimonials', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agency_testimonials' as any)
        .select('*')
        .eq('agency_id', agencyId)
        .order('display_order', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as AgencyTestimonial[];
    },
    enabled: !!agencyId,
  });
}
