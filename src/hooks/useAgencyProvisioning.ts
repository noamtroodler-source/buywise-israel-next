import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ProvisioningAgency = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  description: string | null;
  cities_covered: string[] | null;
  website: string | null;
  office_address: string | null;
  social_links: any;
  admin_user_id: string | null;
  management_status: string;
  agent_email_strategy: string;
  provisioned_at: string | null;
  created_at: string | null;
};

export type ProvisioningAgent = {
  id: string;
  agency_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  license_number: string | null;
  specializations: string[] | null;
  languages: string[] | null;
  user_id: string | null;
  is_provisional: boolean;
  completeness_score: number;
  pending_fields: string[];
  welcome_email_sent_at: string | null;
};

const IN_PROGRESS_STATUSES = ['draft', 'provisioning', 'quality_review', 'ready_for_handover'];

export function useProvisioningAgencies() {
  return useQuery({
    queryKey: ['provisioning-agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name, slug, email, phone, logo_url, description, cities_covered, website, office_address, social_links, admin_user_id, management_status, agent_email_strategy, provisioned_at, created_at')
        .in('management_status', IN_PROGRESS_STATUSES)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProvisioningAgency[];
    },
  });
}

export function useProvisioningAgency(agencyId: string | null) {
  return useQuery({
    queryKey: ['provisioning-agency', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name, slug, email, phone, logo_url, description, cities_covered, website, office_address, social_links, admin_user_id, management_status, agent_email_strategy, provisioned_at, created_at')
        .eq('id', agencyId!)
        .maybeSingle();
      if (error) throw error;
      return data as ProvisioningAgency | null;
    },
  });
}

export function useAgencyAgents(agencyId: string | null) {
  return useQuery({
    queryKey: ['provisioning-agency-agents', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, agency_id, name, email, phone, avatar_url, bio, license_number, specializations, languages, user_id, is_provisional, completeness_score, pending_fields, welcome_email_sent_at')
        .eq('agency_id', agencyId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ProvisioningAgent[];
    },
  });
}

export function useUpdateAgency(agencyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ProvisioningAgency>) => {
      if (!agencyId) throw new Error('No agency selected');
      const { error } = await supabase
        .from('agencies')
        .update(patch as any)
        .eq('id', agencyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-agency', agencyId] });
      qc.invalidateQueries({ queryKey: ['provisioning-agencies'] });
      toast.success('Agency updated');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update agency'),
  });
}

export function useCreateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; slug: string; email?: string }) => {
      const { data, error } = await supabase
        .from('agencies')
        .insert({
          name: input.name,
          slug: input.slug,
          email: input.email || null,
          management_status: 'draft',
        } as any)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-agencies'] });
    },
  });
}

function computeAgentCompleteness(a: Partial<ProvisioningAgent>) {
  const fields: Array<[keyof ProvisioningAgent, boolean]> = [
    ['name', !!a.name],
    ['email', !!a.email],
    ['phone', !!a.phone],
    ['avatar_url', !!a.avatar_url],
    ['bio', !!(a.bio && a.bio.length > 30)],
    ['license_number', !!a.license_number],
    ['specializations', !!(a.specializations && a.specializations.length > 0)],
    ['languages', !!(a.languages && a.languages.length > 0)],
  ];
  const pending = fields.filter(([, ok]) => !ok).map(([k]) => String(k));
  const score = Math.round(((fields.length - pending.length) / fields.length) * 100);
  return { score, pending };
}

export function useCreateAgent(agencyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ProvisioningAgent>) => {
      if (!agencyId) throw new Error('No agency selected');
      if (!input.name || !input.email) throw new Error('Name and email required');
      const { score, pending } = computeAgentCompleteness(input);
      const { data, error } = await supabase
        .from('agents')
        .insert({
          agency_id: agencyId,
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          avatar_url: input.avatar_url || null,
          bio: input.bio || null,
          license_number: input.license_number || null,
          specializations: input.specializations || null,
          languages: input.languages || null,
          completeness_score: score,
          pending_fields: pending,
          status: 'pending' as any,
          is_provisional: true,
        } as any)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-agency-agents', agencyId] });
      toast.success('Agent added');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to add agent'),
  });
}

export function useUpdateAgent(agencyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProvisioningAgent> }) => {
      const { score, pending } = computeAgentCompleteness(patch);
      const { error } = await supabase
        .from('agents')
        .update({
          ...patch,
          completeness_score: score,
          pending_fields: pending,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-agency-agents', agencyId] });
    },
  });
}

export function useProvisionAgencyAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agencyId: string; ownerEmail: string; ownerName: string; ownerPhone?: string }) => {
      const { data, error } = await supabase.functions.invoke('provision-agency-account', { body: input });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed');
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['provisioning-agency', vars.agencyId] });
      qc.invalidateQueries({ queryKey: ['provisioning-agencies'] });
      toast.success('Owner account provisioned');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to provision owner'),
  });
}

export function useProvisionAgentAccount(agencyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agentId: string }) => {
      const { data, error } = await supabase.functions.invoke('provision-agent-account', { body: input });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-agency-agents', agencyId] });
      toast.success('Agent account provisioned');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to provision agent'),
  });
}

export function useRevealCredentials() {
  return useMutation({
    mutationFn: async (input: { userId?: string; credentialId?: string }) => {
      const { data, error } = await supabase.functions.invoke('reveal-credentials', { body: input });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed');
      return data.credential as {
        id: string; userId: string; agencyId: string; role: string;
        email: string | null; fullName: string | null; password: string;
        createdAt: string; deliveredAt: string | null;
      };
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to reveal credentials'),
  });
}
