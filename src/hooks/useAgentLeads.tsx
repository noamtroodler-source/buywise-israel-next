import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed';

export interface Lead {
  id: string;
  property_id: string;
  agent_id: string;
  inquiry_type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  contacted_at: string | null;
  is_read: boolean;
  created_at: string;
  property: {
    id: string;
    title: string;
    city: string;
    price: number;
    images: string[] | null;
  } | null;
}

export function useAgentLeads(statusFilter?: LeadStatus | 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-leads', user?.id, statusFilter],
    queryFn: async () => {
      // First get the agent ID
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (agentError || !agent) {
        throw new Error('Agent not found');
      }

      // Build query
      let query = supabase
        .from('property_inquiries')
        .select(`
          id,
          property_id,
          agent_id,
          inquiry_type,
          name,
          email,
          phone,
          message,
          status,
          notes,
          contacted_at,
          is_read,
          created_at,
          property:properties(id, title, city, price, images)
        `)
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user?.id,
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leadId, 
      status, 
      contactedAt 
    }: { 
      leadId: string; 
      status: LeadStatus; 
      contactedAt?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'contacted' && !contactedAt) {
        updateData.contacted_at = new Date().toISOString();
      } else if (contactedAt) {
        updateData.contacted_at = contactedAt;
      }

      const { error } = await supabase
        .from('property_inquiries')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-leads'] });
      toast.success('Lead status updated');
    },
    onError: (error) => {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
    },
  });
}

export function useUpdateLeadNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, notes }: { leadId: string; notes: string }) => {
      const { error } = await supabase
        .from('property_inquiries')
        .update({ notes })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-leads'] });
      toast.success('Notes saved');
    },
    onError: (error) => {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    },
  });
}

export function useMarkLeadAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('property_inquiries')
        .update({ is_read: true })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-leads'] });
    },
  });
}

export function useLeadStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-lead-stats', user?.id],
    queryFn: async () => {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!agent) return { new: 0, contacted: 0, qualified: 0, closed: 0, total: 0 };

      const { data, error } = await supabase
        .from('property_inquiries')
        .select('status')
        .eq('agent_id', agent.id);

      if (error) throw error;

      const stats = {
        new: 0,
        contacted: 0,
        qualified: 0,
        closed: 0,
        total: data?.length || 0,
      };

      data?.forEach((lead) => {
        const status = (lead.status as LeadStatus) || 'new';
        if (status in stats) {
          stats[status]++;
        }
      });

      return stats;
    },
    enabled: !!user?.id,
  });
}
