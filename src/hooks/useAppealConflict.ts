/**
 * useAppealConflict — Re-opens a resolved cross-agency conflict within the
 * 7-day appeal window. Reverses any ownership transfer and removes any
 * blocklist entries created by the original resolution.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppealParams {
  conflictId: string;
  appealingAgencyId: string;
  reason?: string;
}

export function useAppealConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conflictId, appealingAgencyId, reason }: AppealParams) => {
      const { data, error } = await (supabase as any).rpc('appeal_cross_agency_conflict', {
        p_conflict_id: conflictId,
        p_appealing_agency_id: appealingAgencyId,
        p_reason: reason || null,
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Appeal failed');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cross-agency-conflicts'] });
      qc.invalidateQueries({ queryKey: ['agency-blocklist'] });
      toast.success('Conflict re-opened for review');
    },
    onError: (e: Error) => toast.error(`Appeal failed: ${e.message}`),
  });
}
