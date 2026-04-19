/**
 * useImportConflicts — React Query hooks for the import_conflicts table.
 * Used by the agency-facing /agency/conflicts page so admins can review
 * fields where Yad2 / Madlan / Website disagreed during a cross-source merge.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImportConflict {
  id: string;
  property_id: string;
  agency_id: string | null;
  field_name: string;
  existing_value: any;
  existing_source: string | null;
  incoming_value: any;
  incoming_source: string | null;
  diff_percent: number | null;
  status: 'pending' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  property?: {
    id: string;
    title: string;
    city: string;
    address: string | null;
  };
}

export function useImportConflicts(agencyId: string | undefined, status: 'pending' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['import-conflicts', agencyId, status],
    queryFn: async () => {
      if (!agencyId) return [];
      let q = (supabase as any)
        .from('import_conflicts')
        .select('*, property:properties(id, title, city, address)')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      if (status === 'pending') q = q.eq('status', 'pending');
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ImportConflict[];
    },
    enabled: !!agencyId,
  });
}

export function useResolveConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conflictId,
      propertyId,
      fieldName,
      winningValue,
      winningSource,
    }: {
      conflictId: string;
      propertyId: string;
      fieldName: string;
      winningValue: any;
      winningSource: string;
    }) => {
      // 1. Apply the winning value to the property
      const updates: Record<string, any> = { [fieldName]: winningValue };
      const { error: updateErr } = await (supabase as any)
        .from('properties')
        .update(updates)
        .eq('id', propertyId);
      if (updateErr) throw updateErr;

      // 2. Mark the conflict as resolved
      const { error: confErr } = await (supabase as any)
        .from('import_conflicts')
        .update({
          status: 'resolved',
          resolution: `winning_source:${winningSource}`,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflictId);
      if (confErr) throw confErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['import-conflicts'] });
      qc.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      toast.success('Conflict resolved');
    },
    onError: (err: any) => toast.error(`Failed to resolve: ${err.message}`),
  });
}

export function useDismissConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conflictId: string) => {
      const { error } = await (supabase as any)
        .from('import_conflicts')
        .update({
          status: 'dismissed',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflictId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['import-conflicts'] });
      toast.success('Conflict dismissed');
    },
    onError: (err: any) => toast.error(`Failed to dismiss: ${err.message}`),
  });
}
