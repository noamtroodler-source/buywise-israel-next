import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      // Check if agency is a founding partner
      const { data: partner } = await supabase
        .from('founding_partners')
        .select('id, is_active, free_credits_per_month')
        .eq('agency_id', agencyId)
        .eq('is_active', true)
        .maybeSingle();

      if (!partner) {
        return { isFoundingPartner: false, freeCreditsRemaining: 0, freeCreditsTotal: 0, currentCreditRow: null };
      }

      // Get current month's credit row (not expired)
      const { data: creditRow } = await supabase
        .from('founding_featured_credits')
        .select('id, credits_granted, credits_used')
        .eq('founding_partner_id', partner.id)
        .gte('expires_at', new Date().toISOString())
        .order('month_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const remaining = creditRow
        ? creditRow.credits_granted - creditRow.credits_used
        : 0;

      return {
        isFoundingPartner: true,
        freeCreditsRemaining: Math.max(0, remaining),
        freeCreditsTotal: partner.free_credits_per_month,
        currentCreditRow: creditRow ? { id: creditRow.id, credits_used: creditRow.credits_used, credits_granted: creditRow.credits_granted } : null,
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
      creditRowId,
      currentCreditsUsed,
    }: {
      agencyId: string;
      propertyId: string;
      action: 'activate' | 'deactivate';
      useFreeCredit?: boolean;
      creditRowId?: string;
      currentCreditsUsed?: number;
    }) => {
      if (action === 'activate') {
        // Insert new featured listing
        const { error } = await supabase
          .from('featured_listings')
          .insert({
            agency_id: agencyId,
            property_id: propertyId,
            is_free_credit: useFreeCredit ?? false,
          });

        if (error) throw error;

        // If using free credit, increment credits_used
        if (useFreeCredit && creditRowId && currentCreditsUsed !== undefined) {
          const { error: creditError } = await supabase
            .from('founding_featured_credits')
            .update({ credits_used: currentCreditsUsed + 1 })
            .eq('id', creditRowId);

          if (creditError) throw creditError;
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
