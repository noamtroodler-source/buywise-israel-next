import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingItemsSummary {
  agentsMissingLicense: number;
  agentsPendingEmail: number;
  listingsMissingPhotos: number;
  listingsUnassigned: number;
  listingsCriticalFlags: number;
  listingsWarningFlags: number;
  totalAgents: number;
  totalListings: number;
  emailStrategy: 'send_all_now' | 'send_after_owner';
  handoverCompletedAt: string | null;
  dismissedAt: string | null;
}

/**
 * Fetches consolidated post-handover quality summary for an agency.
 * Used by the owner dashboard "Pending Items" widget.
 */
export function usePendingItems(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency-pending-items', agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<PendingItemsSummary | null> => {
      if (!agencyId) return null;

      const { data: agency } = await supabase
        .from('agencies')
        .select('management_status, agent_email_strategy, handover_completed_at, pending_items_dismissed_at')
        .eq('id', agencyId)
        .maybeSingle();

      if (!agency || agency.management_status !== 'handed_over') return null;

      const { data: agents = [] } = await supabase
        .from('agents')
        .select('id, license_number, welcome_email_sent_at, user_id')
        .eq('agency_id', agencyId);

      const { data: properties = [] } = await supabase
        .from('properties')
        .select('id, agent_id, images')
        .eq('primary_agency_id', agencyId);

      const propertyIds = (properties as any[]).map((p) => p.id);

      let critical = 0;
      let warning = 0;
      if (propertyIds.length > 0) {
        const { data: flags = [] } = await supabase
          .from('listing_quality_flags')
          .select('severity')
          .in('property_id', propertyIds)
          .is('resolved_at', null);
        for (const f of flags as any[]) {
          if (f.severity === 'critical') critical++;
          else if (f.severity === 'warning') warning++;
        }
      }

      return {
        agentsMissingLicense: (agents as any[]).filter((a) => !a.license_number).length,
        agentsPendingEmail: (agents as any[]).filter((a) => a.user_id && !a.welcome_email_sent_at).length,
        listingsMissingPhotos: (properties as any[]).filter(
          (p) => !Array.isArray(p.images) || p.images.length < 5,
        ).length,
        listingsUnassigned: (properties as any[]).filter((p) => !p.agent_id).length,
        listingsCriticalFlags: critical,
        listingsWarningFlags: warning,
        totalAgents: agents.length,
        totalListings: properties.length,
        emailStrategy: (agency.agent_email_strategy ?? 'send_all_now') as 'send_all_now' | 'send_after_owner',
        handoverCompletedAt: agency.handover_completed_at,
        dismissedAt: agency.pending_items_dismissed_at,
      };
    },
  });
}

export function useDismissPendingItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase
        .from('agencies')
        .update({ pending_items_dismissed_at: new Date().toISOString() })
        .eq('id', agencyId);
      if (error) throw error;
    },
    onSuccess: (_d, agencyId) => {
      qc.invalidateQueries({ queryKey: ['agency-pending-items', agencyId] });
    },
  });
}

export function useSendAgentWelcomeEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { data, error } = await supabase.functions.invoke('send-agent-welcome', {
        body: { agencyId },
      });
      if (error) throw error;
      return data as { sent: number; total: number };
    },
    onSuccess: (_d, agencyId) => {
      qc.invalidateQueries({ queryKey: ['agency-pending-items', agencyId] });
    },
  });
}
