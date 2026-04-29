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
  needs_review?: boolean | null;
  enrichment_source?: string | null;
};

const IN_PROGRESS_STATUSES = ['draft', 'provisioning', 'quality_review', 'ready_for_handover'] as const;

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
      const { data, error } = await (supabase as any)
        .from('agents')
        .select('id, agency_id, name, email, phone, avatar_url, bio, license_number, specializations, languages, user_id, is_provisional, completeness_score, pending_fields, welcome_email_sent_at, needs_review, enrichment_source')
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
    mutationFn: async (input: { name: string; slug?: string; email?: string }) => {
      const { generateUniqueAgencySlug } = await import('@/lib/agencySlug');
      const slug = input.slug?.trim() || (await generateUniqueAgencySlug(input.name));
      const { data, error } = await supabase
        .from('agencies')
        .insert({
          name: input.name,
          slug,
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

export function useDeleteProvisioningAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { data, error } = await (supabase as any).rpc('delete_provisioning_agency', {
        p_agency_id: agencyId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, agencyId) => {
      qc.invalidateQueries({ queryKey: ['provisioning-agencies'] });
      qc.invalidateQueries({ queryKey: ['provisioning-agency', agencyId] });
      qc.invalidateQueries({ queryKey: ['admin-agencies'] });
      qc.invalidateQueries({ queryKey: ['admin-agency-stats'] });
      toast.success('Agency deleted');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to delete agency'),
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

// ============================================================================
// Phase 5: Listings + Quality
// ============================================================================

export type ProvisioningListing = {
  id: string;
  title: string | null;
  property_type: string | null;
  listing_status: string | null;
  address: string;
  city: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  size_sqm: number | null;
  lot_size_sqm: number | null;
  bedrooms: number | null;
  additional_rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  images: string[] | null;
  agent_id: string | null;
  primary_agency_id: string | null;
  claimed_by_agency_id: string | null;
  ai_english_description: string | null;
  description: string | null;
  ai_suggestions: Record<string, any> | null;
  data_quality_score: number | null;
  quality_audit_score: number | null;
  provisioning_audit_status: 'pending' | 'flagged' | 'reviewed' | 'approved' | null;
  last_audit_at: string | null;
  source_url: string | null;
  import_source: string | null;
  source_last_checked_at: string | null;
  year_built: number | null;
  condition: string | null;
  ac_type: string | null;
  entry_date: string | null;
  vaad_bayit_monthly: number | null;
  features: string[] | null;
  lease_term: string | null;
  subletting_allowed: string | null;
  furnished_status: string | null;
  pets_policy: string | null;
  agent_fee_required: boolean | null;
  furniture_items: string[] | null;
  featured_highlight: string | null;
  parking: number | null;
};

export type ListingQualityFlag = {
  id: string;
  property_id: string;
  flag_type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string | null;
  auto_resolvable: boolean;
  resolved_at: string | null;
  created_at: string;
};

export function useAgencyListings(agencyId: string | null) {
  return useQuery({
    queryKey: ['provisioning-agency-listings', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      // Get agent ids for this agency
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('agency_id', agencyId!);
      const agentIds = (agents || []).map((a: any) => a.id);

      const orParts = [
        `primary_agency_id.eq.${agencyId}`,
        `claimed_by_agency_id.eq.${agencyId}`,
      ];
      if (agentIds.length > 0) {
        orParts.push(`agent_id.in.(${agentIds.join(',')})`);
      }

      const { data, error } = await supabase
        .from('properties')
        .select(
          'id, title, property_type, listing_status, address, city, neighborhood, latitude, longitude, price, size_sqm, lot_size_sqm, bedrooms, additional_rooms, bathrooms, floor, total_floors, images, agent_id, primary_agency_id, claimed_by_agency_id, ai_english_description, description, ai_suggestions, data_quality_score, quality_audit_score, provisioning_audit_status, last_audit_at, source_url, import_source, source_last_checked_at, year_built, condition, ac_type, entry_date, vaad_bayit_monthly, features, lease_term, subletting_allowed, furnished_status, pets_policy, agent_fee_required, furniture_items, featured_highlight, parking'
        )
        .or(orParts.join(','))
        .order('quality_audit_score', { ascending: true, nullsFirst: true })
        .limit(500);
      if (error) throw error;
      return (data || []) as ProvisioningListing[];
    },
  });
}

export function useListingFlags(agencyId: string | null, propertyIds: string[]) {
  return useQuery({
    queryKey: ['provisioning-listing-flags', agencyId, propertyIds.length],
    enabled: !!agencyId && propertyIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_quality_flags')
        .select('id, property_id, flag_type, severity, message, auto_resolvable, resolved_at, created_at')
        .in('property_id', propertyIds)
        .is('resolved_at', null);
      if (error) throw error;
      return (data || []) as ListingQualityFlag[];
    },
  });
}

export function useRunListingsAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agencyId: string; propertyIds?: string[]; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke('audit-and-enrich-listings', {
        body: {
          agency_id: input.agencyId,
          property_ids: input.propertyIds,
          limit: input.limit ?? 100,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success('Audit started — refreshing in 5s');
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['provisioning-agency-listings', vars.agencyId] });
        qc.invalidateQueries({ queryKey: ['provisioning-listing-flags', vars.agencyId] });
      }, 5000);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to start audit'),
  });
}

export function useUpdateListing(agencyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProvisioningListing> }) => {
      const { error } = await supabase.from('properties').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-agency-listings', agencyId] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update listing'),
  });
}

export function useResolveFlag(agencyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (flagId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('listing_quality_flags')
        .update({ resolved_at: new Date().toISOString(), resolved_by: userData.user?.id || null })
        .eq('id', flagId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-listing-flags', agencyId] });
      qc.invalidateQueries({ queryKey: ['provisioning-agency-listings', agencyId] });
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to resolve flag'),
  });
}

export function useBulkUpdateListings(agencyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<ProvisioningListing> }) => {
      const { error } = await supabase.from('properties').update(patch as any).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-agency-listings', agencyId] });
      toast.success('Listings updated');
    },
    onError: (e: any) => toast.error(e?.message || 'Bulk update failed'),
  });
}

export function useRevealCredentials() {
  return useMutation({
    mutationFn: async (input: { userId?: string; credentialId?: string }) => {
      const { data, error } = await supabase.functions.invoke('reveal-credentials', { body: input });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed');
      return data.credential as {
        id: string | null; userId: string; agencyId: string | null; role: string | null;
        email: string | null; fullName: string | null; password: string | null;
        createdAt: string | null; deliveredAt: string | null; unavailableReason?: string;
      };
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to reveal credentials'),
  });
}

// Phase 9 — admin lifecycle tools
export type AgencyLifecycleRow = {
  id: string;
  name: string;
  slug: string;
  management_status: string;
  agent_email_strategy: string;
  provisioned_at: string | null;
  handover_completed_at: string | null;
  created_at: string | null;
  agent_count: number;
  listing_count: number;
};

export function useAllAgenciesLifecycle() {
  return useQuery({
    queryKey: ['agencies-lifecycle'],
    queryFn: async (): Promise<AgencyLifecycleRow[]> => {
      const { data: agencies, error } = await supabase
        .from('agencies')
        .select('id, name, slug, management_status, agent_email_strategy, provisioned_at, handover_completed_at, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = (agencies || []).map((a: any) => a.id);
      if (ids.length === 0) return [];

      // Aggregate counts in two cheap queries
      const [{ data: agentRows = [] }, { data: listingRows = [] }] = await Promise.all([
        supabase.from('agents').select('agency_id').in('agency_id', ids),
        (supabase as any).from('properties').select('agency_id').in('agency_id', ids),
      ]);

      const agentCounts = new Map<string, number>();
      for (const r of agentRows as any[]) {
        if (!r.agency_id) continue;
        agentCounts.set(r.agency_id, (agentCounts.get(r.agency_id) ?? 0) + 1);
      }
      const listingCounts = new Map<string, number>();
      for (const r of listingRows as any[]) {
        if (!r.agency_id) continue;
        listingCounts.set(r.agency_id, (listingCounts.get(r.agency_id) ?? 0) + 1);
      }

      return (agencies as any[]).map((a) => ({
        ...a,
        agent_count: agentCounts.get(a.id) ?? 0,
        listing_count: listingCounts.get(a.id) ?? 0,
      })) as AgencyLifecycleRow[];
    },
  });
}

export type AuditLogEntry = {
  id: string;
  action: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  target_property_id: string | null;
  metadata: any;
  created_at: string;
};

export function useAgencyAuditLog(agencyId: string | null) {
  return useQuery({
    queryKey: ['provisioning-audit-log', agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const { data, error } = await supabase
        .from('agency_provisioning_audit')
        .select('id, action, actor_user_id, target_user_id, target_property_id, metadata, created_at')
        .eq('agency_id', agencyId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as AuditLogEntry[];
    },
  });
}

export function useResendSetupLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; purpose: 'owner_setup' | 'agent_setup' }) => {
      const { data, error } = await supabase.functions.invoke('resend-setup-link', { body: input });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed');
      return data as { token: string; agencyId: string };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['provisioning-audit-log', res.agencyId] });
      toast.success('Fresh setup link issued');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to resend link'),
  });
}

/**
 * Re-verifies the current admin's password by attempting a fresh sign-in.
 * Used as defense in depth before revealing credentials.
 */
export function useReauthAdmin() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error('Not signed in');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Password did not match');
      return true;
    },
  });
}

// ============================================================================
// Perplexity Enrichment — bulk-import agency + agents from pasted JSON
// ============================================================================

export type EnrichedAgencyPayload = {
  agency: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    description?: string | null;
    office_address?: string | null;
    cities_covered?: string[] | null;
    logo_url?: string | null;
    social_links?: Record<string, string> | null;
  };
  agents: Array<{
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    license_number?: string | null;
    role?: string | null;
    specializations?: string[] | null;
    languages?: string[] | null;
  }>;
};

export function useEnrichAgencyFromPayload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { payload: EnrichedAgencyPayload; existingAgencyId?: string }) => {
      const { payload, existingAgencyId } = input;
      let agencyId = existingAgencyId;

      if (!agencyId) {
        if (!payload.agency?.name) throw new Error('Agency name missing in payload');
        const { generateUniqueAgencySlug } = await import('@/lib/agencySlug');
        const slug = await generateUniqueAgencySlug(payload.agency.name);
        const { data: newAgency, error: createErr } = await supabase
          .from('agencies')
          .insert({
            name: payload.agency.name,
            slug,
            email: payload.agency.email || null,
            phone: payload.agency.phone || null,
            website: payload.agency.website || null,
            description: payload.agency.description || null,
            office_address: payload.agency.office_address || null,
            cities_covered: payload.agency.cities_covered || null,
            logo_url: payload.agency.logo_url || null,
            social_links: payload.agency.social_links || null,
            management_status: 'draft',
          } as any)
          .select('id')
          .single();
        if (createErr) throw createErr;
        agencyId = newAgency.id as string;
      } else {
        const patch: Record<string, any> = {};
        for (const [k, v] of Object.entries(payload.agency || {})) {
          if (v !== undefined && v !== null && v !== '') patch[k] = v;
        }
        if (Object.keys(patch).length > 0) {
          await supabase.from('agencies').update(patch as any).eq('id', agencyId);
        }
      }

      const { data: existingAgents } = await (supabase as any)
        .from('agents')
        .select('email')
        .eq('agency_id', agencyId);
      const existingEmails = new Set(
        (existingAgents || []).map((a: any) => (a.email || '').toLowerCase()).filter(Boolean)
      );

      let inserted = 0;
      let skipped = 0;
      for (const a of payload.agents || []) {
        if (!a.name) { skipped++; continue; }
        const emailLower = (a.email || '').toLowerCase();
        if (emailLower && existingEmails.has(emailLower)) { skipped++; continue; }

        const fields: Array<[string, boolean]> = [
          ['name', !!a.name],
          ['email', !!a.email],
          ['phone', !!a.phone],
          ['avatar_url', !!a.avatar_url],
          ['bio', !!(a.bio && a.bio.length > 30)],
          ['license_number', !!a.license_number],
          ['specializations', !!(a.specializations && a.specializations.length)],
          ['languages', !!(a.languages && a.languages.length)],
        ];
        const pending = fields.filter(([, ok]) => !ok).map(([k]) => k);
        const score = Math.round(((fields.length - pending.length) / fields.length) * 100);

        const { error: insErr } = await (supabase as any).from('agents').insert({
          agency_id: agencyId,
          name: a.name,
          email: a.email || null,
          phone: a.phone || null,
          avatar_url: a.avatar_url || null,
          bio: a.bio || null,
          license_number: a.license_number || null,
          specializations: a.specializations || null,
          languages: a.languages || null,
          completeness_score: score,
          pending_fields: pending,
          status: 'pending',
          is_provisional: true,
          needs_review: true,
          enrichment_source: 'perplexity',
        } as any);
        if (insErr) {
          console.error('Agent insert failed', insErr);
          skipped++;
        } else {
          inserted++;
          if (emailLower) existingEmails.add(emailLower);
        }
      }

      return { agencyId: agencyId!, inserted, skipped };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['provisioning-agencies'] });
      qc.invalidateQueries({ queryKey: ['provisioning-agency', res.agencyId] });
      qc.invalidateQueries({ queryKey: ['provisioning-agency-agents', res.agencyId] });
    },
  });
}

