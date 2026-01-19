import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ManagedAgency {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  cities_covered: string[] | null;
  specializations: string[] | null;
  is_verified: boolean | null;
  is_accepting_agents: boolean | null;
  default_invite_code: string | null;
  created_at: string | null;
}

export interface AgencyAgent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  status: string;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  agent_id: string;
  status: string;
  message: string | null;
  requested_at: string;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    license_number: string | null;
  };
}

export function useMyAgency() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myAgency', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('admin_user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ManagedAgency | null;
    },
    enabled: !!user,
  });
}

export function useAgencyTeam(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyTeam', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('agents')
        .select('id, name, email, phone, avatar_url, is_verified, status, created_at')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgencyAgent[];
    },
    enabled: !!agencyId,
  });
}

export function useAgencyJoinRequests(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyJoinRequests', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('agency_join_requests')
        .select(`
          id,
          agent_id,
          status,
          message,
          requested_at,
          agent:agent_id (
            id,
            name,
            email,
            phone,
            license_number
          )
        `)
        .eq('agency_id', agencyId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as JoinRequest[];
    },
    enabled: !!agencyId,
  });
}

export function useAgencyInvites(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyInvites', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('agency_invites')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });
}

export function useCreateInviteCode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      agencyId, 
      maxUses 
    }: { 
      agencyId: string; 
      maxUses?: number;
    }) => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from('agency_invites')
        .insert({
          agency_id: agencyId,
          code,
          created_by: user?.id,
          uses_remaining: maxUses || null,
          max_uses: maxUses || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyInvites'] });
      toast.success('Invite code created');
    },
    onError: (error) => {
      toast.error('Failed to create invite code: ' + error.message);
    },
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, agentId, agencyId }: { requestId: string; agentId: string; agencyId: string }) => {
      // Update the request status
      const { error: requestError } = await supabase
        .from('agency_join_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Link the agent to the agency
      const { error: agentError } = await supabase
        .from('agents')
        .update({ agency_id: agencyId })
        .eq('id', agentId);

      if (agentError) throw agentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyJoinRequests'] });
      queryClient.invalidateQueries({ queryKey: ['agencyTeam'] });
      toast.success('Agent added to team');
    },
    onError: (error) => {
      toast.error('Failed to approve request: ' + error.message);
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const { error } = await supabase
        .from('agency_join_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: reason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyJoinRequests'] });
      toast.success('Request rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject request: ' + error.message);
    },
  });
}

export function useAgencyStats(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyDashboardStats', agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      // Get agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('agency_id', agencyId);

      const agentIds = agents?.map(a => a.id) || [];

      if (agentIds.length === 0) {
        return {
          totalAgents: 0,
          activeListings: 0,
          pendingListings: 0,
          totalViews: 0,
        };
      }

      // Get properties
      const { data: properties } = await supabase
        .from('properties')
        .select('verification_status, views_count')
        .in('agent_id', agentIds);

      const activeListings = properties?.filter(p => (p as any).verification_status === 'approved').length || 0;
      const pendingListings = properties?.filter(p => (p as any).verification_status === 'pending_review').length || 0;
      const totalViews = properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

      return {
        totalAgents: agentIds.length,
        activeListings,
        pendingListings,
        totalViews,
      };
    },
    enabled: !!agencyId,
  });
}

interface UpdateAgencyData {
  id: string;
  name?: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  cities_covered?: string[] | null;
  specializations?: string[] | null;
  is_accepting_agents?: boolean;
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAgencyData) => {
      const { error } = await supabase
        .from('agencies')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAgency'] });
      queryClient.invalidateQueries({ queryKey: ['agency'] });
      toast.success('Agency profile updated');
    },
    onError: (error) => {
      toast.error('Failed to update agency: ' + error.message);
    },
  });
}

export function useDeactivateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('agency_invites')
        .update({ is_active: false })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyInvites'] });
      toast.success('Invite code deactivated');
    },
    onError: (error) => {
      toast.error('Failed to deactivate invite: ' + error.message);
    },
  });
}
