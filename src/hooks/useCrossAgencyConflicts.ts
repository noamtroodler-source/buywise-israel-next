import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrossAgencyConflict {
  id: string;
  existing_property_id: string;
  existing_agency_id: string | null;
  existing_source_url: string | null;
  attempted_agency_id: string;
  attempted_source_url: string;
  attempted_source_type: string | null;
  similarity_score: number;
  match_details: Record<string, any> | null;
  status: 'pending' | 'co_listing_confirmed' | 'existing_agency_confirmed' | 'attempted_agency_confirmed' | 'dismissed';
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  existing_agency?: { id: string; name: string; slug: string } | null;
  attempted_agency?: { id: string; name: string; slug: string } | null;
  property?: { id: string; title: string | null; city: string | null; address: string | null; price: number | null } | null;
}

export function useCrossAgencyConflicts(agencyId?: string, statusFilter: 'pending' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['cross-agency-conflicts', agencyId, statusFilter],
    queryFn: async (): Promise<CrossAgencyConflict[]> => {
      let query = supabase
        .from('cross_agency_conflicts')
        .select(`
          *,
          existing_agency:agencies!cross_agency_conflicts_existing_agency_id_fkey(id, name, slug),
          attempted_agency:agencies!cross_agency_conflicts_attempted_agency_id_fkey(id, name, slug),
          property:properties!cross_agency_conflicts_existing_property_id_fkey(id, title, city, address, price)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('status', 'pending');
      }

      if (agencyId) {
        query = query.or(`existing_agency_id.eq.${agencyId},attempted_agency_id.eq.${agencyId}`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data as unknown as CrossAgencyConflict[]) || [];
    },
    staleTime: 30 * 1000,
  });
}

export type ConflictResolution =
  | 'co_listing_confirmed'
  | 'existing_agency_confirmed'
  | 'attempted_agency_confirmed'
  | 'dismissed';

export function useResolveCrossAgencyConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conflictId,
      resolution,
      notes,
    }: {
      conflictId: string;
      resolution: ConflictResolution;
      notes?: string;
    }) => {
      // Load conflict to determine blocklist actions
      const { data: conflict, error: cErr } = await supabase
        .from('cross_agency_conflicts')
        .select('*')
        .eq('id', conflictId)
        .single();
      if (cErr || !conflict) throw cErr || new Error('Conflict not found');

      // Update conflict status
      const { error: updateErr } = await supabase
        .from('cross_agency_conflicts')
        .update({
          status: resolution,
          resolution_notes: notes || null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflictId);
      if (updateErr) throw updateErr;

      // Apply blocklist based on resolution
      if (resolution === 'existing_agency_confirmed') {
        // Block the attempted agency from re-importing this URL
        await supabase.from('agency_source_blocklist').insert({
          agency_id: conflict.attempted_agency_id,
          blocked_url: conflict.attempted_source_url,
          reason: `Confirmed as belonging to existing agency`,
          conflict_id: conflictId,
        });
      } else if (resolution === 'attempted_agency_confirmed' && conflict.existing_agency_id && conflict.existing_source_url) {
        // Block the existing agency from re-importing the original URL
        await supabase.from('agency_source_blocklist').insert({
          agency_id: conflict.existing_agency_id,
          blocked_url: conflict.existing_source_url,
          reason: `Listing confirmed as belonging to ${conflict.attempted_agency_id}`,
          conflict_id: conflictId,
        });
      }
      // co_listing_confirmed and dismissed: no blocklist
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cross-agency-conflicts'] });
      toast.success('Conflict resolved');
    },
    onError: (e: Error) => toast.error(`Failed to resolve: ${e.message}`),
  });
}
