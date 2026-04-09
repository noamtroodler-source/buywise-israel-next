/**
 * useAgencySources — React Query hooks for the agency_sources table
 * and listing_claim_requests table. Used in admin scraping management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AgencySource {
  id: string;
  agency_id: string;
  source_type: 'yad2' | 'madlan' | 'website';
  source_url: string;
  is_active: boolean;
  priority: 1 | 2 | 3;
  last_synced_at: string | null;
  last_sync_job_id: string | null;
  last_sync_listings_found: number;
  consecutive_failures: number;
  last_failure_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  agency?: { id: string; name: string; logo_url: string | null };
}

export interface ClaimRequest {
  id: string;
  property_id: string;
  agency_id: string | null;
  claimant_name: string | null;
  claimant_email: string;
  claimant_phone: string | null;
  agency_name: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'duplicate';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  verification_note: string | null;
  created_at: string;
  property?: {
    id: string;
    title: string;
    city: string;
    address: string;
    price: number;
    source_url: string | null;
    import_source: string | null;
  };
}

// ─── Agency Sources hooks ────────────────────────────────────────────────────

export function useAgencySources(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-sources', agencyId],
    queryFn: async () => {
      let q = (supabase as any)
        .from('agency_sources')
        .select('*, agency:agencies(id, name, logo_url)')
        .order('priority', { ascending: true })
        .order('last_synced_at', { ascending: true, nullsFirst: true });
      if (agencyId) q = q.eq('agency_id', agencyId);
      const { data, error } = await q;
      if (error) throw error;
      return data as AgencySource[];
    },
  });
}

export function useAgencySourceStats() {
  return useQuery({
    queryKey: ['agency-source-stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('agency_sources')
        .select('is_active, source_type, consecutive_failures');
      if (error) throw error;
      const sources = data as AgencySource[];
      return {
        total: sources.length,
        active: sources.filter((s) => s.is_active).length,
        inactive: sources.filter((s) => !s.is_active).length,
        failing: sources.filter((s) => s.consecutive_failures > 0).length,
        byType: {
          yad2: sources.filter((s) => s.source_type === 'yad2').length,
          madlan: sources.filter((s) => s.source_type === 'madlan').length,
          website: sources.filter((s) => s.source_type === 'website').length,
        },
      };
    },
  });
}

export function useCreateAgencySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      agency_id: string;
      source_type: 'yad2' | 'madlan' | 'website';
      source_url: string;
      priority?: 1 | 2 | 3;
      notes?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('agency_sources')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-sources'] });
      qc.invalidateQueries({ queryKey: ['agency-source-stats'] });
      toast.success('Source added');
    },
    onError: (err: any) => toast.error(`Failed to add source: ${err.message}`),
  });
}

export function useUpdateAgencySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<AgencySource, 'is_active' | 'priority' | 'source_url' | 'notes'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('agency_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-sources'] });
      qc.invalidateQueries({ queryKey: ['agency-source-stats'] });
    },
    onError: (err: any) => toast.error(`Failed to update source: ${err.message}`),
  });
}

export function useDeleteAgencySource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('agency_sources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-sources'] });
      qc.invalidateQueries({ queryKey: ['agency-source-stats'] });
      toast.success('Source removed');
    },
    onError: (err: any) => toast.error(`Failed to remove source: ${err.message}`),
  });
}

// Trigger a manual sync for a single source
export function useTriggerSourceSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: AgencySource) => {
      // Call the import-agency-listings function directly
      const sourceType = source.source_type;
      const body = {
        action: 'discover',
        agency_id: source.agency_id,
        website_url: source.source_url,
        source_type: sourceType,
        import_type: 'resale',
      };

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'import-agency-listings',
        { body }
      );
      if (fnError) throw fnError;
      return fnData;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['agency-sources'] });
      if (data.job_id) {
        toast.success(
          `Sync started — ${data.new_urls || 0} new URLs queued`
        );
      } else {
        toast.info('No new listings found');
      }
    },
    onError: (err: any) => toast.error(`Sync failed: ${err.message}`),
  });
}

// Trigger the full nightly scheduler manually
export function useTriggerNightlySync() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'nightly-scrape-scheduler',
        { body: {} }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `Full sync complete — ${data.total_new_listings || 0} new listings from ${data.sources_processed || 0} sources`
      );
    },
    onError: (err: any) => toast.error(`Full sync failed: ${err.message}`),
  });
}

// ─── Claim Request hooks ─────────────────────────────────────────────────────

export function useClaimRequests(status?: ClaimRequest['status']) {
  return useQuery({
    queryKey: ['claim-requests', status],
    queryFn: async () => {
      let q = (supabase as any)
        .from('listing_claim_requests')
        .select(
          `*, property:properties(id, title, city, address, price, source_url, import_source)`
        )
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as ClaimRequest[];
    },
  });
}

export function useClaimRequestStats() {
  return useQuery({
    queryKey: ['claim-request-stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('listing_claim_requests')
        .select('status');
      if (error) throw error;
      const items = data as { status: string }[];
      return {
        total: items.length,
        pending: items.filter((i) => i.status === 'pending').length,
        approved: items.filter((i) => i.status === 'approved').length,
        rejected: items.filter((i) => i.status === 'rejected').length,
      };
    },
  });
}

export function useApproveClaimRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      propertyId,
      agencyId,
      notes,
    }: {
      claimId: string;
      propertyId: string;
      agencyId?: string;
      notes?: string;
    }) => {
      // 1. Approve the claim request
      const { error: claimErr } = await (supabase as any)
        .from('listing_claim_requests')
        .update({
          status: 'approved',
          review_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', claimId);
      if (claimErr) throw claimErr;

      // 2. Mark the property as claimed + publish it
      const { error: propErr } = await (supabase as any)
        .from('properties')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          claimed_by_agency_id: agencyId || null,
          is_published: true,
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId);
      if (propErr) throw propErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['claim-requests'] });
      qc.invalidateQueries({ queryKey: ['claim-request-stats'] });
      toast.success('Claim approved — listing is now published');
    },
    onError: (err: any) => toast.error(`Failed to approve claim: ${err.message}`),
  });
}

export function useRejectClaimRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      notes,
    }: {
      claimId: string;
      notes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('listing_claim_requests')
        .update({
          status: 'rejected',
          review_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['claim-requests'] });
      qc.invalidateQueries({ queryKey: ['claim-request-stats'] });
      toast.success('Claim rejected');
    },
    onError: (err: any) => toast.error(`Failed to reject claim: ${err.message}`),
  });
}
