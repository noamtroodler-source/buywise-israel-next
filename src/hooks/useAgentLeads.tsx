import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

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
  quality_feedback?: {
    id: string;
    lead_quality_rating: number | null;
    buyer_preparedness: string | null;
    lead_quality_reason: string | null;
    price_context_complete: boolean | null;
    price_context_confidence_tier: string | null;
    price_context_public_label: string | null;
  } | null;
  property: {
    id: string;
    title: string;
    city: string;
    price: number;
    images: string[] | null;
    price_context_confidence_tier: string | null;
    price_context_public_label: string | null;
    price_context_percentage_suppressed: boolean | null;
  } | null;
}

type LeadQualityFeedbackRow = NonNullable<Lead['quality_feedback']> & { inquiry_id: string };
type LeadResponseEventInsert = Database['public']['Tables']['lead_response_events']['Insert'];
type LeadResponseEventUpdate = Database['public']['Tables']['lead_response_events']['Update'];
type PropertyInquiryUpdate = Database['public']['Tables']['property_inquiries']['Update'];

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
          property:properties(id, title, city, price, images, price_context_confidence_tier, price_context_public_label, price_context_percentage_suppressed)
        `)
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const leads = (data ?? []) as Lead[];
      const leadIds = leads.map((lead) => lead.id);

      if (leadIds.length === 0) return leads;

      const { data: qualityEvents, error: qualityError } = await supabase
        .from('lead_response_events')
        .select('id, inquiry_id, lead_quality_rating, buyer_preparedness, lead_quality_reason, price_context_complete, price_context_confidence_tier, price_context_public_label, created_at')
        .in('inquiry_id', leadIds)
        .not('lead_quality_rating', 'is', null)
        .order('created_at', { ascending: false });

      if (qualityError) throw qualityError;

      const feedbackByLead = new Map<string, Lead['quality_feedback']>();
      ((qualityEvents ?? []) as LeadQualityFeedbackRow[]).forEach((event) => {
        if (!feedbackByLead.has(event.inquiry_id)) {
          feedbackByLead.set(event.inquiry_id, event);
        }
      });

      return leads.map((lead) => ({
        ...lead,
        quality_feedback: feedbackByLead.get(lead.id) ?? null,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useUpsertLeadQualityFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lead,
      rating,
      buyerPreparedness,
      reason,
    }: {
      lead: Lead;
      rating: number;
      buyerPreparedness: 'well_prepared' | 'some_context' | 'unclear' | 'unqualified';
      reason?: string;
    }) => {
      const priceContextComplete = lead.property?.price_context_confidence_tier === 'strong_comparable_match'
        || lead.property?.price_context_percentage_suppressed === false;

      const payload: LeadResponseEventInsert = {
        inquiry_id: lead.id,
        inquiry_type: 'property',
        agent_id: lead.agent_id,
        lead_quality_rating: rating,
        buyer_preparedness: buyerPreparedness,
        lead_quality_reason: reason?.trim() || null,
        price_context_complete: priceContextComplete,
        price_context_confidence_tier: lead.property?.price_context_confidence_tier ?? null,
        price_context_public_label: lead.property?.price_context_public_label ?? null,
        responded_at: new Date().toISOString(),
      };

      if (lead.quality_feedback?.id) {
        const { error } = await supabase
          .from('lead_response_events')
          .update(payload as LeadResponseEventUpdate)
          .eq('id', lead.quality_feedback.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from('lead_response_events')
        .insert(payload);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-quality-analytics'] });
      toast.success('Lead quality saved');
    },
    onError: (error) => {
      console.error('Failed to save lead quality:', error);
      toast.error('Failed to save lead quality');
    },
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
      const updateData: PropertyInquiryUpdate = { status };
      
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
