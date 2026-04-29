import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getPriceContextFeatureGuardrail } from '@/lib/priceContextGuardrails';

export interface FeaturedListing {
  id: string;
  agency_id: string;
  property_id: string;
  is_active: boolean;
  is_free_credit: boolean;
  started_at: string;
  cancelled_at: string | null;
  created_at: string;
}

export interface FoundingPartnerStatus {
  isFoundingPartner: boolean;
  freeCreditsRemaining: number;
  freeCreditsTotal: number;
  freeCreditsUsed?: number;
  currentCreditRow: { id: string; credits_used: number; credits_granted: number } | null;
}

export function useFeaturedListings(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['featuredListings', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('featured_listings')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as FeaturedListing[];
    },
    enabled: !!agencyId,
  });
}

export function useFoundingPartnerStatus(agencyId: string | undefined) {
  return useQuery<FoundingPartnerStatus>({
    queryKey: ['foundingPartnerStatus', agencyId],
    queryFn: async () => {
      if (!agencyId) {
        return { isFoundingPartner: false, freeCreditsRemaining: 0, freeCreditsTotal: 0, currentCreditRow: null };
      }

      const { data, error } = await (supabase.rpc as any)('get_founding_featured_status', { p_agency_id: agencyId });
      if (error) throw error;

      return {
        isFoundingPartner: !!data?.isFoundingPartner,
        freeCreditsRemaining: Number(data?.freeCreditsRemaining ?? 0),
        freeCreditsTotal: Number(data?.freeCreditsTotal ?? 3),
        freeCreditsUsed: Number(data?.freeCreditsUsed ?? 0),
        currentCreditRow: null,
      };
    },
    enabled: !!agencyId,
  });
}

export function useToggleFeaturedListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      propertyId,
      action,
      useFreeCredit,
    }: {
      agencyId: string;
      propertyId: string;
      action: 'activate' | 'deactivate';
      useFreeCredit?: boolean;
    }) => {
      if (action === 'activate') {
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('listing_status, price_context_badge_status, benchmark_review_status')
          .eq('id', propertyId)
          .single();

        if (propertyError) throw propertyError;

        const guardrail = getPriceContextFeatureGuardrail(property ?? {});
        if (!guardrail.eligible) {
          throw new Error(guardrail.reason ?? 'This listing is not eligible for featured placement yet.');
        }

        // Insert new featured listing
        const { error } = await supabase
          .from('featured_listings')
          .insert({
            agency_id: agencyId,
            property_id: propertyId,
            is_free_credit: useFreeCredit ?? false,
          });

        if (error) throw error;

        // Activate primary-slot boost on the property. If this agency is
        // already primary, this is a no-op that just stamps the boost
        // window. If they're secondary, it promotes them to primary for
        // the duration — the old primary drops to "also listed by".
        const { error: boostError } = await (supabase.rpc as any)('start_primary_boost', {
          p_property_id: propertyId,
          p_agency_id: agencyId,
          p_duration_days: 30,
        });
        if (boostError) {
          // Don't fail the whole activation — featured treatment still
          // applies, the co-listing primary swap is a nice-to-have.
          console.error('start_primary_boost failed:', boostError.message);
        }
      } else {
        // Deactivate: set is_active = false and cancelled_at
        const { error } = await supabase
          .from('featured_listings')
          .update({
            is_active: false,
            cancelled_at: new Date().toISOString(),
          })
          .eq('agency_id', agencyId)
          .eq('property_id', propertyId)
          .eq('is_active', true);

        if (error) throw error;

        // If the deactivating agency is currently boost-holding primary,
        // revert primary to the prior holder.
        const { error: endError } = await (supabase.rpc as any)('end_primary_boost', {
          p_property_id: propertyId,
          p_agency_id: agencyId,
        });
        if (endError) {
          console.error('end_primary_boost failed:', endError.message);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['featuredListings'] });
      queryClient.invalidateQueries({ queryKey: ['foundingPartnerStatus'] });
      toast.success(
        variables.action === 'activate'
          ? 'Listing is now featured!'
          : 'Featured listing cancelled'
      );
    },
    onError: (error) => {
      toast.error('Failed to update featured status: ' + error.message);
    },
  });
}
