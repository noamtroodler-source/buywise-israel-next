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
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  images: string[] | null;
  description: string | null;
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
          property_type,
          bedrooms,
          bathrooms,
          size_sqm,
          images,
          description,
          verification_status,
          rejection_reason,
          admin_notes,
          submitted_at,
          reviewed_at,
          created_at,
          is_published,
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
      return data as PropertyForReview[];
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

export function useApproveListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
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
    mutationFn: async ({ id, reason, adminNotes }: { id: string; reason: string; adminNotes?: string }) => {
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
    mutationFn: async ({ id, reason, adminNotes }: { id: string; reason: string; adminNotes?: string }) => {
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
