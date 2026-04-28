import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VerificationStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected';

export interface PropertyForReview {
  id: string;
  title: string;
  address: string;
  city: string;
  neighborhood: string | null;
  price: number;
  currency: string | null;
  property_type: string;
  listing_status: string;
  bedrooms: number | null;
  additional_rooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  lot_size_sqm: number | null;
  floor: number | null;
  total_floors: number | null;
  apartment_number: string | null;
  latitude: number | null;
  longitude: number | null;
  source_rooms: number | null;
  year_built: number | null;
  parking: number | null;
  condition: string | null;
  ac_type: string | null;
  vaad_bayit_monthly: number | null;
  entry_date: string | null;
  features: string[] | null;
  images: string[] | null;
  description: string | null;
  has_balcony: boolean | null;
  has_elevator: boolean | null;
  has_storage: boolean | null;
  lease_term: string | null;
  subletting_allowed: string | null;
  pets_policy: string | null;
  agent_fee_required: boolean | null;
  furnished_status: string | null;
  furniture_items: string[] | null;
  featured_highlight: string | null;
  premium_drivers: string[] | null;
  premium_explanation: string | null;
  sqm_source: string | null;
  ownership_type: string | null;
  benchmark_review_status: string | null;
  benchmark_review_reason: string | null;
  benchmark_review_notes: string | null;
  price_context_property_class: string | null;
  price_context_confidence_score: number | null;
  price_context_confidence_tier: string | null;
  price_context_public_label: string | null;
  price_context_percentage_suppressed: boolean | null;
  price_context_badge_status: string | null;
  comp_pool_used: string | null;
  market_fit_status: string | null;
  market_fit_review_reason: string | null;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  admin_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  is_published: boolean;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    agency_name: string | null;
    is_verified: boolean | null;
  } | null;
  primary_agency: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface PriceContextEvent {
  id: string;
  property_id: string;
  event_type: string;
  actor_type: string;
  actor_id: string | null;
  raw_gap_percent: number | null;
  public_label: string | null;
  percentage_suppressed: boolean | null;
  confidence_tier: string | null;
  comp_pool_snapshot: Record<string, unknown> | null;
  premium_context_snapshot: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export function useListingsForReview(status?: VerificationStatus) {
  return useQuery({
    queryKey: ['listingsForReview', status],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          neighborhood,
          price,
          currency,
          property_type,
          listing_status,
          bedrooms,
          additional_rooms,
          bathrooms,
          size_sqm,
          lot_size_sqm,
          floor,
          total_floors,
          apartment_number,
          latitude,
          longitude,
          source_rooms,
          year_built,
          parking,
          condition,
          ac_type,
          vaad_bayit_monthly,
          entry_date,
          features,
          images,
          description,
          has_balcony,
          has_elevator,
          has_storage,
          lease_term,
          subletting_allowed,
          pets_policy,
          agent_fee_required,
          furnished_status,
          furniture_items,
          featured_highlight,
          premium_drivers,
          premium_explanation,
          sqm_source,
          ownership_type,
          benchmark_review_status,
          benchmark_review_reason,
          benchmark_review_notes,
          price_context_property_class,
          price_context_confidence_score,
          price_context_confidence_tier,
          price_context_public_label,
          price_context_percentage_suppressed,
          price_context_badge_status,
          comp_pool_used,
          market_fit_status,
          market_fit_review_reason,
          verification_status,
          rejection_reason,
          admin_notes,
          submitted_at,
          reviewed_at,
          created_at,
          is_published,
          primary_agency:agencies!properties_primary_agency_id_fkey (
            id,
            name,
            email,
            phone
          ),
          agent:agent_id (
            id,
            name,
            email,
            phone,
            agency_name,
            is_verified
          )
        `)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (status) {
        query = query.eq('verification_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PropertyForReview[];
    },
  });
}

export function usePendingReviewCount() {
  return useQuery({
    queryKey: ['pendingReviewCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending_review');
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function usePriceContextEvents(propertyId: string) {
  return useQuery({
    queryKey: ['priceContextEvents', propertyId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('price_context_events' as any)
        .select('*') as any)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      return (data ?? []) as PriceContextEvent[];
    },
    enabled: Boolean(propertyId),
  });
}

async function logPriceContextEvent(propertyId: string, eventType: string, reason?: string) {
  try {
    const [{ data: propertyData }, { data: userData }] = await Promise.all([
      (supabase
        .from('properties')
        .select('price_context_confidence_score, price_context_confidence_tier, price_context_public_label, price_context_percentage_suppressed, price_context_badge_status, price_context_property_class, comp_pool_used, premium_drivers, premium_explanation') as any)
        .eq('id', propertyId)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);

    const property = propertyData as Partial<PropertyForReview> | null;

    const { error } = await (supabase.from('price_context_events' as any) as any).insert({
      property_id: propertyId,
      event_type: eventType,
      actor_type: 'admin',
      actor_id: userData.user?.id ?? null,
      public_label: property?.price_context_public_label ?? null,
      percentage_suppressed: property?.price_context_percentage_suppressed ?? null,
      confidence_tier: property?.price_context_confidence_tier ?? null,
      comp_pool_snapshot: {
        source: property?.comp_pool_used ?? null,
        badge_status: property?.price_context_badge_status ?? null,
        property_class: property?.price_context_property_class ?? null,
        confidence_score: property?.price_context_confidence_score ?? null,
      },
      premium_context_snapshot: {
        drivers: property?.premium_drivers ?? [],
        explanation_present: Boolean(property?.premium_explanation),
      },
      reason: reason ?? null,
    });

    if (error) throw error;
  } catch (error) {
    console.warn('Failed to write Price Context audit event:', error);
  }
}

async function sendNotification(payload: {
  type: string;
  agentId: string;
  propertyId?: string;
  propertyTitle?: string;
  message?: string;
  rejectionReason?: string;
  inquirerName?: string;
  inquirerEmail?: string;
  inquiryType?: string;
}) {
  try {
    await supabase.functions.invoke('send-notification', {
      body: payload,
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

export function useApproveListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, adminNotes, agentId, propertyTitle }: { 
      id: string; 
      adminNotes?: string;
      agentId?: string;
      propertyTitle?: string;
    }) => {
      const { error } = await supabase
        .from('properties')
        .update({
          verification_status: 'approved',
          is_published: true,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await logPriceContextEvent(id, 'admin_approved', adminNotes);

      // Send notification to agent
      if (agentId) {
        await sendNotification({
          type: 'listing_approved',
          agentId,
          propertyId: id,
          propertyTitle: propertyTitle || 'Your property',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listingsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });
      toast.success('Listing approved and published!');
    },
    onError: (error) => {
      toast.error('Failed to approve listing: ' + error.message);
    },
  });
}

export function useRequestChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason, adminNotes, agentId, propertyTitle }: { 
      id: string; 
      reason: string; 
      adminNotes?: string;
      agentId?: string;
      propertyTitle?: string;
    }) => {
      const { error } = await supabase
        .from('properties')
        .update({
          verification_status: 'changes_requested',
          rejection_reason: reason,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          is_published: false,
        })
        .eq('id', id);

      if (error) throw error;
      await logPriceContextEvent(id, 'admin_changes_requested', reason);

      // Send notification to agent
      if (agentId) {
        await sendNotification({
          type: 'changes_requested',
          agentId,
          propertyId: id,
          propertyTitle: propertyTitle || 'Your property',
          message: reason,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listingsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });
      toast.success('Changes requested - agent will be notified');
    },
    onError: (error) => {
      toast.error('Failed to request changes: ' + error.message);
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason, adminNotes, agentId, propertyTitle }: { 
      id: string; 
      reason: string; 
      adminNotes?: string;
      agentId?: string;
      propertyTitle?: string;
    }) => {
      const { error } = await supabase
        .from('properties')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          is_published: false,
        })
        .eq('id', id);

      if (error) throw error;
      await logPriceContextEvent(id, 'admin_rejected', reason);

      // Send notification to agent
      if (agentId) {
        await sendNotification({
          type: 'listing_rejected',
          agentId,
          propertyId: id,
          propertyTitle: propertyTitle || 'Your property',
          rejectionReason: reason,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listingsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });
      toast.success('Listing rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject listing: ' + error.message);
    },
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: ['reviewStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('verification_status');

      if (error) throw error;

      const stats = {
        draft: 0,
        pending_review: 0,
        changes_requested: 0,
        approved: 0,
        rejected: 0,
      };

      data?.forEach((p) => {
        const status = p.verification_status as VerificationStatus;
        if (status in stats) {
          stats[status]++;
        }
      });

      return stats;
    },
  });
}
