import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const BENCHMARK_REVIEW_REASONS = [
  'Wrong location or geocode',
  'Wrong property type',
  'Wrong sqm',
  'Wrong room count',
  'New-build compared to resale',
  'Penthouse/garden/sea-view features not reflected',
  'Comps are too old or too far away',
  'Price includes parking, storage, furniture, or extras',
  'Better comparable sales exist',
  'Recent deal not yet in government records',
  'Other explanation',
] as const;

export function useRequestBenchmarkReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, reason, notes }: { propertyId: string; reason: string; notes?: string }) => {
      const [{ error: updateError }, { data: userData }] = await Promise.all([
        supabase
          .from('properties')
          .update({
            benchmark_review_status: 'requested',
            benchmark_review_reason: reason,
            benchmark_review_notes: notes?.trim() || null,
            benchmark_review_requested_at: new Date().toISOString(),
            benchmark_review_resolved_at: null,
            benchmark_review_admin_notes: null,
            benchmark_review_resolution: null,
            price_context_badge_status: 'blocked',
            price_context_public_label: 'Market context under review',
            price_context_filter_eligible: false,
            price_context_placement_eligible: false,
            price_context_featured_eligible: false,
          } as any)
          .eq('id', propertyId),
        supabase.auth.getUser(),
      ]);

      if (updateError) throw updateError;

      const { error: eventError } = await (supabase.from('price_context_events' as any) as any).insert({
        property_id: propertyId,
        event_type: 'benchmark_review_requested',
        actor_type: 'professional',
        actor_id: userData.user?.id ?? null,
        public_label: 'Market context under review',
        percentage_suppressed: true,
        confidence_tier: 'limited_comparable_match',
        comp_pool_snapshot: { review_status: 'requested' },
        premium_context_snapshot: null,
        reason: notes?.trim() ? `${reason}: ${notes.trim()}` : reason,
      });

      if (eventError) console.warn('Benchmark review event was not logged:', eventError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      queryClient.invalidateQueries({ queryKey: ['listingsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Benchmark review requested');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to request benchmark review');
    },
  });
}