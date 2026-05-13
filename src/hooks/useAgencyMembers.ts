import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgencyMember {
  id: string;
  agency_id: string;
  user_id: string;
  role: 'owner' | 'admin';
  is_primary_contact: boolean;
  created_at: string;
  // Enriched
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  agent_id?: string | null;
}

export function useAgencyMembers(agencyId: string | undefined | null) {
  return useQuery({
    queryKey: ['agencyMembers', agencyId],
    queryFn: async (): Promise<AgencyMember[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agency_members')
        .select('*')
        .eq('agency_id', agencyId)
        .order('role', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;

      const members = (data ?? []) as AgencyMember[];
      const userIds = members.map((m) => m.user_id);
      if (userIds.length === 0) return members;

      // Enrich with agent profile (name/email/avatar) when available
      const { data: agents } = await supabase
        .from('agents')
        .select('id, user_id, name, email, avatar_url')
        .in('user_id', userIds)
        .eq('agency_id', agencyId);

      const byUser = new Map((agents ?? []).map((a: any) => [a.user_id, a]));
      return members.map((m) => {
        const a = byUser.get(m.user_id);
        return {
          ...m,
          agent_id: a?.id ?? null,
          display_name: a?.name ?? null,
          email: a?.email ?? null,
          avatar_url: a?.avatar_url ?? null,
        };
      });
    },
    enabled: !!agencyId,
  });
}

export function usePromoteToAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { agencyId: string; userId: string }) => {
      const { data, error } = await supabase.functions.invoke('agency-promote-member', {
        body: { agency_id: vars.agencyId, user_id: vars.userId, action: 'promote' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success('Member promoted to Admin');
      qc.invalidateQueries({ queryKey: ['agencyMembers', vars.agencyId] });
      qc.invalidateQueries({ queryKey: ['agencyTeam', vars.agencyId] });
      qc.invalidateQueries({ queryKey: ['agencyPermissions'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to promote'),
  });
}

export function useDemoteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { agencyId: string; userId: string }) => {
      const { data, error } = await supabase.functions.invoke('agency-promote-member', {
        body: { agency_id: vars.agencyId, user_id: vars.userId, action: 'demote' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success('Admin demoted');
      qc.invalidateQueries({ queryKey: ['agencyMembers', vars.agencyId] });
      qc.invalidateQueries({ queryKey: ['agencyPermissions'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to demote'),
  });
}

export function useSetPrimaryContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { agencyId: string; userId: string }) => {
      const { data, error } = await supabase.functions.invoke('agency-promote-member', {
        body: { agency_id: vars.agencyId, user_id: vars.userId, action: 'set_primary' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success('Primary contact updated');
      qc.invalidateQueries({ queryKey: ['agencyMembers', vars.agencyId] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to set primary contact'),
  });
}

export function useTransferOwnership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { agencyId: string; newOwnerUserId: string }) => {
      const { data, error } = await supabase.functions.invoke('agency-transfer-ownership', {
        body: { agency_id: vars.agencyId, new_owner_user_id: vars.newOwnerUserId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success('Ownership transferred');
      qc.invalidateQueries({ queryKey: ['agencyMembers', vars.agencyId] });
      qc.invalidateQueries({ queryKey: ['agencyPermissions'] });
      qc.invalidateQueries({ queryKey: ['myAgency'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to transfer ownership'),
  });
}

export function useDeleteAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { agencyId: string; confirmName: string }) => {
      const { data, error } = await supabase.functions.invoke('agency-delete', {
        body: { agency_id: vars.agencyId, confirm_name: vars.confirmName },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Agency deleted');
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to delete agency'),
  });
}
