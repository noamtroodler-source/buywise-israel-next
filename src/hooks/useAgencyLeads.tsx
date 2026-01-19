import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgencyLead {
  id: string;
  property_id: string;
  agent_id: string;
  agency_id: string | null;
  assigned_to: string | null;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string | null;
  is_read: boolean | null;
  created_at: string;
  property?: {
    id: string;
    title: string;
    city: string;
    images: string[] | null;
  };
}

export function useAgencyLeads(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyLeads', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('property_inquiries')
        .select(`
          id,
          property_id,
          agent_id,
          agency_id,
          assigned_to,
          user_id,
          name,
          email,
          phone,
          message,
          status,
          is_read,
          created_at,
          property:property_id (
            id,
            title,
            city,
            images
          )
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgencyLead[];
    },
    enabled: !!agencyId,
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from('property_inquiries')
        .update({ 
          status,
          is_read: true,
          contacted_at: status === 'contacted' ? new Date().toISOString() : undefined,
        })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyLeads'] });
      toast.success('Lead status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}

export function useReassignLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, agentId }: { leadId: string; agentId: string }) => {
      const { error } = await supabase
        .from('property_inquiries')
        .update({ assigned_to: agentId })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyLeads'] });
      toast.success('Lead reassigned');
    },
    onError: (error) => {
      toast.error('Failed to reassign lead: ' + error.message);
    },
  });
}
