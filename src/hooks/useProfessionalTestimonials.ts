import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfessionalTestimonial {
  id: string;
  professional_id: string;
  quote: string;
  author_name: string;
  author_context: string | null;
  service_used: string | null;
  display_order: number;
  created_at: string;
}

export function useProfessionalTestimonials(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['professional-testimonials', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from('professional_testimonials' as any)
        .select('*')
        .eq('professional_id', professionalId)
        .order('display_order', { ascending: true })
        .limit(3);
      if (error) throw error;
      return (data || []) as unknown as ProfessionalTestimonial[];
    },
    enabled: !!professionalId,
  });
}
