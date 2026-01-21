import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AgencyStatus = 'pending' | 'active' | 'suspended';

export interface AdminAgency {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  founded_year: number | null;
  is_verified: boolean | null;
  is_accepting_agents: boolean | null;
  cities_covered: string[] | null;
  specializations: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  admin_user_id: string | null;
  status: AgencyStatus | null;
  verification_status: string | null;
  approved_at: string | null;
  approved_by: string | null;
  // Aggregated data
  agent_count?: number;
  listing_count?: number;
}

export function useAdminAgencies(status?: AgencyStatus) {
  return useQuery({
    queryKey: ['admin-agencies', status],
    queryFn: async () => {
      // Fetch agencies
      let query = supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: agencies, error: agenciesError } = await query;

      if (agenciesError) throw agenciesError;

      // Fetch agent counts per agency
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('agency_id')
        .not('agency_id', 'is', null);

      if (agentsError) throw agentsError;

      // Fetch property counts per agency (through agents)
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('agent_id, agents!inner(agency_id)')
        .not('agent_id', 'is', null);

      if (propertiesError) throw propertiesError;

      // Aggregate counts
      const agencyAgentCounts: Record<string, number> = {};
      const agencyListingCounts: Record<string, number> = {};

      agents?.forEach(agent => {
        if (agent.agency_id) {
          agencyAgentCounts[agent.agency_id] = (agencyAgentCounts[agent.agency_id] || 0) + 1;
        }
      });

      properties?.forEach((prop: any) => {
        const agencyId = prop.agents?.agency_id;
        if (agencyId) {
          agencyListingCounts[agencyId] = (agencyListingCounts[agencyId] || 0) + 1;
        }
      });

      // Combine data
      const enrichedAgencies: AdminAgency[] = (agencies || []).map(agency => ({
        ...agency,
        status: (agency.status as AgencyStatus) || (agency.is_verified ? 'active' : 'pending'),
        agent_count: agencyAgentCounts[agency.id] || 0,
        listing_count: agencyListingCounts[agency.id] || 0,
      }));

      return enrichedAgencies;
    },
  });
}

export function useAgencyStats() {
  return useQuery({
    queryKey: ['admin-agency-stats'],
    queryFn: async () => {
      const { data: agencies, error } = await supabase
        .from('agencies')
        .select('status, is_verified');

      if (error) throw error;

      return {
        total: agencies?.length || 0,
        pending: agencies?.filter(a => a.status === 'pending' || (!a.status && !a.is_verified)).length || 0,
        active: agencies?.filter(a => a.status === 'active' || (!a.status && a.is_verified)).length || 0,
        suspended: agencies?.filter(a => a.status === 'suspended').length || 0,
      };
    },
  });
}

export function useVerifyAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('agencies')
        .update({ 
          is_verified: true,
          status: 'active',
          verification_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', agencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agency-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-agency'] });
      queryClient.invalidateQueries({ queryKey: ['agency'] });
      toast.success('Agency verified successfully');
    },
    onError: (error) => {
      toast.error('Failed to verify agency');
      console.error(error);
    },
  });
}

export function useUnverifyAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase
        .from('agencies')
        .update({ 
          is_verified: false,
          status: 'pending',
          verification_status: 'pending'
        })
        .eq('id', agencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agency-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-agency'] });
      queryClient.invalidateQueries({ queryKey: ['agency'] });
      toast.success('Agency verification removed');
    },
    onError: (error) => {
      toast.error('Failed to update agency');
      console.error(error);
    },
  });
}

export function useSuspendAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase
        .from('agencies')
        .update({ 
          is_verified: false,
          status: 'suspended',
          verification_status: 'suspended'
        })
        .eq('id', agencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agency-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-agency'] });
      queryClient.invalidateQueries({ queryKey: ['agency'] });
      toast.success('Agency suspended');
    },
    onError: (error) => {
      toast.error('Failed to suspend agency');
      console.error(error);
    },
  });
}

export function useDeleteAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agency-stats'] });
      toast.success('Agency deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete agency');
      console.error(error);
    },
  });
}
