import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AgencyReviewStatus = 'needs_review' | 'approved_live' | 'needs_edit' | 'archived_stale';

export interface ListingQualityFlag {
  severity: 'critical' | 'warning' | string;
  field_name: string | null;
  message: string | null;
}

export interface AgencyListing {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  currency: string | null;
  property_type: string;
  listing_status: string;
  verification_status: string;
  is_published: boolean | null;
  views_count: number | null;
  total_saves: number;
  images: string[] | null;
  agent_id: string | null;
  primary_agency_id: string | null;
  import_source: string | null;
  merged_source_urls: string[] | null;
  boost_active_until: string | null;
  boosted_by_agency_id: string | null;
  source_url?: string | null;
  source_last_checked_at?: string | null;
  neighborhood?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  floor?: number | null;
  total_floors?: number | null;
  data_quality_score?: number | null;
  agency_review_status: AgencyReviewStatus;
  agency_reviewed_at: string | null;
  agency_review_notes: string | null;
  agency_review_skipped_at: string | null;
  quality_flags: ListingQualityFlag[];
  missing_quick_fields: string[];
  has_critical_flags: boolean;
  safe_to_batch_approve: boolean;
  created_at: string;
  updated_at: string;
  /** Total inquiries across ALL agencies on this property. */
  inquiries_count: number;
  /** Inquiries attributed to one of THIS agency's agents. */
  my_inquiries_count: number;
  /** Role of this agency on the property. */
  role: 'primary' | 'co_listed';
  /** Count of OTHER agencies co-listed (primary + secondary minus this agency). */
  other_agencies_count: number;
  /** True when THIS agency currently holds a primary-slot boost. */
  has_active_boost: boolean;
}

/**
 * Lists every property this agency participates in, both as primary and as
 * a secondary co-listing agent. Each row carries:
 *   - role:                 'primary' | 'co_listed'
 *   - inquiries_count:       total across all agencies (property-level)
 *   - my_inquiries_count:    inquiries routed to this agency's agents
 *   - other_agencies_count:  number of OTHER agencies on the property
 *
 * Uses primary_agency_id (Phase 1) as the authoritative "owned by" marker,
 * falls back to agent → agent.agency_id for rows that predate backfill.
 */
export function useAgencyListingsManagement(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyListingsManagement', agencyId],
    queryFn: async () => {
      if (!agencyId) return [] as AgencyListing[];

      // All agents belonging to the agency (for per-agency inquiry attribution)
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .eq('agency_id', agencyId);
      if (agentsError) throw agentsError;
      const agentIds = (agents ?? []).map((a) => a.id);

      // Primary properties: where this agency is the primary
      const primaryFetch: any = (supabase
        .from('properties') as any)
        .select(`
          id, title, address, city, price, currency,
          property_type, listing_status, verification_status, is_published,
          views_count, total_saves, images, agent_id,
          primary_agency_id, import_source, merged_source_urls,
          source_url, source_last_checked_at, neighborhood,
          bedrooms, bathrooms, size_sqm, floor, total_floors,
          data_quality_score,
          boost_active_until, boosted_by_agency_id,
          created_at, updated_at
        `)
        .eq('primary_agency_id', agencyId)
        .order('created_at', { ascending: false });

      // Co-listed properties: where this agency appears in property_co_agents
      const coListedIdsFetch = supabase
        .from('property_co_agents' as any)
        .select('property_id')
        .eq('agency_id', agencyId);

      const [{ data: primaryData, error: primaryErr }, { data: coRows }] =
        await Promise.all([primaryFetch, coListedIdsFetch]);
      if (primaryErr) throw primaryErr;

      const coListedIds = (coRows ?? [])
        .map((r: any) => r.property_id)
        .filter(Boolean) as string[];

      let coListedData: any[] = [];
      if (coListedIds.length > 0) {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id, title, address, city, price, currency,
            property_type, listing_status, verification_status, is_published,
            views_count, total_saves, images, agent_id,
            primary_agency_id, import_source, merged_source_urls,
            source_url, source_last_checked_at, neighborhood,
            bedrooms, bathrooms, size_sqm, floor, total_floors,
            data_quality_score,
            created_at, updated_at
          `)
          .in('id', coListedIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        coListedData = data ?? [];
      }

      // Merge, dedupe by id, tag role based on primary_agency_id
      const byId = new Map<string, any>();
      for (const row of primaryData ?? []) byId.set(row.id, row);
      for (const row of coListedData) if (!byId.has(row.id)) byId.set(row.id, row);
      const rows = Array.from(byId.values());

      const propertyIds = rows.map((r) => r.id);
      if (propertyIds.length === 0) return [] as AgencyListing[];

      // Inquiry counts — total + this-agency-agents share
      const [{ data: totalInquiries }, { data: myInquiries }] = await Promise.all([
        (supabase
          .from('property_inquiries') as any)
          .select('property_id')
          .in('property_id', propertyIds),
        agentIds.length > 0
          ? (supabase
              .from('property_inquiries') as any)
              .select('property_id')
              .in('property_id', propertyIds)
              .in('agent_id', agentIds)
          : Promise.resolve({ data: [] as { property_id: string | null }[] }),
      ]);

      const totalMap: Record<string, number> = {};
      (totalInquiries ?? []).forEach((i: any) => {
        if (i.property_id) totalMap[i.property_id] = (totalMap[i.property_id] || 0) + 1;
      });
      const myMap: Record<string, number> = {};
      (myInquiries ?? []).forEach((i: any) => {
        if (i.property_id) myMap[i.property_id] = (myMap[i.property_id] || 0) + 1;
      });

      // Secondary-agent counts per property (excluding this agency)
      const { data: allCoAgentRows } = await supabase
        .from('property_co_agents' as any)
        .select('property_id, agency_id')
        .in('property_id', propertyIds);
      const otherAgenciesMap: Record<string, Set<string>> = {};
      (allCoAgentRows ?? []).forEach((r: any) => {
        if (!r.property_id || !r.agency_id) return;
        if (r.agency_id === agencyId) return;
        if (!otherAgenciesMap[r.property_id]) otherAgenciesMap[r.property_id] = new Set();
        otherAgenciesMap[r.property_id].add(r.agency_id);
      });
      // Include primary agencies that aren't this one
      rows.forEach((r) => {
        if (r.primary_agency_id && r.primary_agency_id !== agencyId) {
          if (!otherAgenciesMap[r.id]) otherAgenciesMap[r.id] = new Set();
          otherAgenciesMap[r.id].add(r.primary_agency_id);
        }
      });

      const now = Date.now();
      const [{ data: reviewRows }, { data: flagRows }] = await Promise.all([
        (supabase
          .from('listing_agency_reviews' as any) as any)
          .select('property_id, status, reviewed_at, review_notes, skipped_at')
          .in('property_id', propertyIds),
        (supabase
          .from('listing_quality_flags' as any) as any)
          .select('property_id, severity, field_name, message')
          .in('property_id', propertyIds)
          .is('resolved_at', null),
      ]);

      const reviewMap = new Map<string, any>();
      (reviewRows ?? []).forEach((r: any) => reviewMap.set(r.property_id, r));
      const flagsByProperty: Record<string, ListingQualityFlag[]> = {};
      (flagRows ?? []).forEach((f: any) => {
        if (!f.property_id) return;
        if (!flagsByProperty[f.property_id]) flagsByProperty[f.property_id] = [];
        flagsByProperty[f.property_id].push({
          severity: f.severity,
          field_name: f.field_name,
          message: f.message,
        });
      });

      return rows.map((p) => {
        const isPrimary = p.primary_agency_id === agencyId;
        const boostUntil = p.boost_active_until ? new Date(p.boost_active_until).getTime() : null;
        const hasActiveBoost =
          p.boosted_by_agency_id === agencyId && boostUntil !== null && boostUntil > now;
        const review = reviewMap.get(p.id);
        const qualityFlags = flagsByProperty[p.id] ?? [];
        const missingQuickFields = [
          !p.title?.trim() ? 'Title' : null,
          !p.address?.trim() ? 'Street address' : null,
          !p.city?.trim() ? 'City' : null,
          !p.price ? 'Price' : null,
          !p.property_type ? 'Property type' : null,
          !p.neighborhood ? 'Neighborhood' : null,
          !Array.isArray(p.images) || p.images.length < 3 ? 'More photos' : null,
          !p.size_sqm ? 'Size' : null,
          !p.bathrooms ? 'Bathrooms' : null,
          p.floor === null || p.floor === undefined ? 'Floor' : null,
          !p.agent_id ? 'Agent' : null,
        ].filter(Boolean) as string[];
        const hasCriticalFlags = qualityFlags.some((flag) => flag.severity === 'critical');
        return {
          ...p,
          inquiries_count: totalMap[p.id] || 0,
          my_inquiries_count: myMap[p.id] || 0,
          role: isPrimary ? 'primary' : 'co_listed',
          other_agencies_count: otherAgenciesMap[p.id]?.size || 0,
          has_active_boost: hasActiveBoost,
          agency_review_status: (review?.status ?? (p.verification_status === 'approved' ? 'approved_live' : 'needs_review')) as AgencyReviewStatus,
          agency_reviewed_at: review?.reviewed_at ?? null,
          agency_review_notes: review?.review_notes ?? null,
          agency_review_skipped_at: review?.skipped_at ?? null,
          quality_flags: qualityFlags,
          missing_quick_fields: missingQuickFields,
          has_critical_flags: hasCriticalFlags,
          safe_to_batch_approve: !hasCriticalFlags && !!p.price && !!p.city && !!p.property_type && !!p.agent_id,
        };
      }) as AgencyListing[];
    },
    enabled: !!agencyId,
  });
}

function useReviewMutation(
  rpcName: 'approve_agency_listing' | 'mark_agency_listing_needs_edit' | 'archive_agency_listing' | 'skip_agency_listing_review' | 'bulk_approve_agency_listings',
  successMessage: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { propertyId?: string; propertyIds?: string[]; notes?: string; agencyId?: string }) => {
      const params = rpcName === 'bulk_approve_agency_listings'
        ? { p_property_ids: payload.propertyIds ?? [] }
        : rpcName === 'skip_agency_listing_review'
          ? { p_property_id: payload.propertyId }
          : { p_property_id: payload.propertyId, p_notes: payload.notes ?? null };
      const { data, error } = await (supabase.rpc as any)(rpcName, params);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(successMessage);
      if (variables.agencyId) {
        qc.invalidateQueries({ queryKey: ['agencyListingsManagement', variables.agencyId] });
        qc.invalidateQueries({ queryKey: ['agency-pending-items', variables.agencyId] });
      } else {
        qc.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      }
    },
    onError: (error: any) => toast.error(error?.message || 'Could not update listing review'),
  });
}

export const useApproveAgencyListing = () => useReviewMutation('approve_agency_listing', 'Listing approved and published');
export const useMarkAgencyListingNeedsEdit = () => useReviewMutation('mark_agency_listing_needs_edit', 'Listing moved to quick edits');
export const useArchiveAgencyListing = () => useReviewMutation('archive_agency_listing', 'Listing archived internally');
export const useSkipAgencyListingReview = () => useReviewMutation('skip_agency_listing_review', 'Listing skipped for later');
export const useBulkApproveAgencyListings = () => useReviewMutation('bulk_approve_agency_listings', 'Safe listings approved');

export function useUnpublishAgencyListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId }: { propertyId: string; agencyId?: string }) => {
      const { error } = await supabase
        .from('properties')
        .update({ is_published: false } as any)
        .eq('id', propertyId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success('Listing unpublished');
      if (variables.agencyId) {
        qc.invalidateQueries({ queryKey: ['agencyListingsManagement', variables.agencyId] });
        qc.invalidateQueries({ queryKey: ['agency-pending-items', variables.agencyId] });
      } else {
        qc.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      }
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (error: any) => toast.error(error?.message || 'Could not unpublish listing'),
  });
}
