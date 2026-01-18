import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type AgentStatus = Database['public']['Enums']['agent_status'];

export interface AdminAgent {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  agency_id: string | null;
  agency_name: string | null;
  status: AgentStatus;
  is_verified: boolean | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  bio: string | null;
  years_experience: number | null;
  specializations: string[] | null;
  languages: string[] | null;
  avatar_url: string | null;
  agency?: {
    name: string;
    slug: string;
  } | null;
}

export function useAdminAgents(status?: AgentStatus) {
  return useQuery({
    queryKey: ['admin-agents', status],
    queryFn: async () => {
      let query = supabase
        .from('agents')
        .select(`
          *,
          agency:agencies(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AdminAgent[];
    },
  });
}

export function useAgentStats() {
  return useQuery({
    queryKey: ['admin-agent-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        active: data.filter(a => a.status === 'active').length,
        suspended: data.filter(a => a.status === 'suspended').length,
      };

      return stats;
    },
  });
}

export function useApproveAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('agents')
        .update({
          status: 'active',
          is_verified: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-stats'] });
      toast.success('Agent approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve agent');
      console.error(error);
    },
  });
}

export function useSuspendAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'suspended' })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-stats'] });
      toast.success('Agent suspended');
    },
    onError: (error) => {
      toast.error('Failed to suspend agent');
      console.error(error);
    },
  });
}

export function useReinstateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'active' })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-stats'] });
      toast.success('Agent reinstated');
    },
    onError: (error) => {
      toast.error('Failed to reinstate agent');
      console.error(error);
    },
  });
}
