/**
 * useAdminColisting — admin-only hooks for the Phase 6 tooling surfaces:
 *   - primary_agency_history (viewer + filters)
 *   - primary_disputes (queue + resolve)
 *   - merge_events (reversal list, read-only for now)
 *   - admin_override_primary (manual reassignment action)
 *
 * All hooks assume the caller has the admin role. RLS on the underlying
 * tables + the RPCs enforce this server-side.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────

export type PrimaryHistoryReason =
  | 'first_import'
  | 'manual_upgrade'
  | 'boost_start'
  | 'boost_end'
  | 'admin_override'
  | 'agency_churn'
  | 'stale_demotion'
  | 'dispute_resolution'
  | 'legacy_migration';

export interface PrimaryHistoryRow {
  id: string;
  property_id: string;
  previous_agency_id: string | null;
  new_agency_id: string;
  reason: PrimaryHistoryReason;
  actor_user_id: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  property?: { id: string; title: string | null; city: string | null; address: string | null };
  previous_agency?: { id: string; name: string; logo_url: string | null } | null;
  new_agency?: { id: string; name: string; logo_url: string | null } | null;
}

export interface PrimaryDisputeRow {
  id: string;
  property_id: string;
  disputing_agency_id: string;
  target_agency_id: string;
  reason: string | null;
  evidence_url: string | null;
  status: 'pending' | 'resolved_uphold' | 'resolved_dismiss' | 'withdrawn';
  resolved_by: string | null;
  resolved_at: string | null;
  admin_notes: string | null;
  created_at: string;
  // Joined
  property?: { id: string; title: string | null; city: string | null; address: string | null };
  disputing_agency?: { id: string; name: string; logo_url: string | null } | null;
  target_agency?: { id: string; name: string; logo_url: string | null } | null;
}

export interface MergeEventRow {
  id: string;
  winner_property_id: string;
  loser_property_id: string;
  merged_at: string;
  merged_by: string | null;
  loser_snapshot: Record<string, unknown>;
  unmerge_deadline: string;
  unmerged_at: string | null;
  unmerged_by: string | null;
}

export interface ColistingReportRow {
  id: string;
  property_id: string;
  reported_co_agent_id: string | null;
  reason: string | null;
  reporter_user_id: string | null;
  reporter_email: string | null;
  status: 'pending' | 'accepted' | 'dismissed';
  resolved_by: string | null;
  resolved_at: string | null;
  admin_notes: string | null;
  created_at: string;
  // Joined
  property?: { id: string; title: string | null; city: string | null; address: string | null };
}

// ─── Primary history ───────────────────────────────────────────────────────

export interface HistoryFilters {
  reason?: PrimaryHistoryReason | 'all';
  limit?: number;
}

export function useAdminPrimaryHistory(filters: HistoryFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'primary-history', filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from('primary_agency_history')
        .select(`
          id, property_id, previous_agency_id, new_agency_id, reason,
          actor_user_id, notes, created_at,
          property:properties(id, title, city, address),
          previous_agency:agencies!primary_agency_history_previous_agency_id_fkey(id, name, logo_url),
          new_agency:agencies!primary_agency_history_new_agency_id_fkey(id, name, logo_url)
        `)
        .order('created_at', { ascending: false })
        .limit(filters.limit ?? 200);

      if (filters.reason && filters.reason !== 'all') {
        q = q.eq('reason', filters.reason);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PrimaryHistoryRow[];
    },
  });
}

// ─── Primary disputes ──────────────────────────────────────────────────────

export interface DisputeFilters {
  status?: PrimaryDisputeRow['status'] | 'all';
}

export function useAdminPrimaryDisputes(filters: DisputeFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'primary-disputes', filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from('primary_disputes')
        .select(`
          id, property_id, disputing_agency_id, target_agency_id,
          reason, evidence_url, status, resolved_by, resolved_at,
          admin_notes, created_at,
          property:properties(id, title, city, address),
          disputing_agency:agencies!primary_disputes_disputing_agency_id_fkey(id, name, logo_url),
          target_agency:agencies!primary_disputes_target_agency_id_fkey(id, name, logo_url)
        `)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        q = q.eq('status', filters.status);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PrimaryDisputeRow[];
    },
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      disputeId: string;
      resolution: 'resolved_uphold' | 'resolved_dismiss';
      notes?: string;
    }) => {
      const { error } = await (supabase.rpc as any)('resolve_primary_dispute', {
        p_dispute_id: params.disputeId,
        p_resolution: params.resolution,
        p_admin_notes: params.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'primary-disputes'] });
      qc.invalidateQueries({ queryKey: ['admin', 'primary-history'] });
      toast.success(
        vars.resolution === 'resolved_uphold'
          ? 'Dispute upheld — primary reassigned'
          : 'Dispute dismissed',
      );
    },
    onError: (err) => toast.error(`Failed to resolve dispute: ${(err as Error).message}`),
  });
}

export function useAdminOverridePrimary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      propertyId: string;
      newAgencyId: string;
      reason?: string;
    }) => {
      const { error } = await (supabase.rpc as any)('admin_override_primary', {
        p_property_id: params.propertyId,
        p_new_agency_id: params.newAgencyId,
        p_reason_note: params.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'primary-history'] });
      qc.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      qc.invalidateQueries({ queryKey: ['agency-listings'] });
      toast.success('Primary agency reassigned');
    },
    onError: (err) => toast.error(`Override failed: ${(err as Error).message}`),
  });
}

// ─── Colisting reports (buyer "not the same apartment" queue) ──────────────

export function useAdminColistingReports(status: ColistingReportRow['status'] | 'all' = 'pending') {
  return useQuery({
    queryKey: ['admin', 'colisting-reports', status],
    queryFn: async () => {
      let q = (supabase as any)
        .from('colisting_reports')
        .select(`
          id, property_id, reported_co_agent_id, reason,
          reporter_user_id, reporter_email, status, resolved_by,
          resolved_at, admin_notes, created_at,
          property:properties(id, title, city, address)
        `)
        .order('created_at', { ascending: false });
      if (status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ColistingReportRow[];
    },
  });
}

export function useResolveColistingReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      reportId: string;
      status: 'accepted' | 'dismissed';
      notes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('colisting_reports')
        .update({
          status: params.status,
          resolved_at: new Date().toISOString(),
          admin_notes: params.notes ?? null,
        })
        .eq('id', params.reportId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'colisting-reports'] });
      toast.success(
        vars.status === 'accepted' ? 'Report accepted' : 'Report dismissed',
      );
    },
    onError: (err) => toast.error(`Failed to update report: ${(err as Error).message}`),
  });
}

// ─── Telemetry (Phase 10) ──────────────────────────────────────────────────

export interface ColistingTelemetry {
  coverage: {
    published_properties: number;
    with_co_agents: number;
    coverage_pct: number;
  };
  transitions_7d: Record<string, number>;
  disputes: {
    open_now: number;
    filed_30d: number;
    by_status_30d: Record<string, number>;
  };
  stale_demotions_30d: number;
  boosts: {
    active_now: number;
    activations_30d: number;
  };
  reports: {
    open_now: number;
    filed_30d: number;
  };
  per_agency: {
    avg_primary_listings: number;
    avg_co_agent_rows: number;
  };
  generated_at: string;
}

export function useColistingTelemetry() {
  return useQuery({
    queryKey: ['admin', 'colisting-telemetry'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_colisting_telemetry');
      if (error) throw error;
      return data as ColistingTelemetry;
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
  });
}

// ─── Merge events (read-only list for now) ─────────────────────────────────

export function useAdminMergeEvents() {
  return useQuery({
    queryKey: ['admin', 'merge-events'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('merge_events')
        .select(`
          id, winner_property_id, loser_property_id, merged_at,
          merged_by, loser_snapshot, unmerge_deadline,
          unmerged_at, unmerged_by
        `)
        .order('merged_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as MergeEventRow[];
    },
  });
}
