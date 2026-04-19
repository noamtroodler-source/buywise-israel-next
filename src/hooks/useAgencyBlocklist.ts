/**
 * useAgencyBlocklist — fetches the URLs that an agency is blocked from
 * re-importing as a result of cross-agency conflict resolutions.
 *
 * The blocklist is enforced server-side in import-agency-listings (it skips
 * any URL whose normalized form appears in agency_source_blocklist for that
 * agency). This hook surfaces those entries in the UI so agencies understand
 * why certain listings aren't being imported anymore.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlocklistEntry {
  id: string;
  agency_id: string;
  blocked_url: string;
  reason: string | null;
  created_at: string;
  conflict_id: string | null;
}

export function useAgencyBlocklist(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-blocklist', agencyId],
    queryFn: async (): Promise<BlocklistEntry[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agency_source_blocklist')
        .select('id, agency_id, blocked_url, reason, created_at, conflict_id')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as BlocklistEntry[]) || [];
    },
    enabled: !!agencyId,
    staleTime: 60 * 1000,
  });
}

/**
 * Removes a URL from an agency's blocklist. Used when an agency confirms
 * a previous "blocked" decision was wrong (e.g., they re-acquired the
 * listing legitimately and want to re-enable importing).
 */
export function useRemoveBlocklistEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('agency_source_blocklist')
        .delete()
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-blocklist'] });
      toast.success('URL unblocked — it can be imported again');
    },
    onError: (e: Error) => toast.error(`Failed to unblock: ${e.message}`),
  });
}
