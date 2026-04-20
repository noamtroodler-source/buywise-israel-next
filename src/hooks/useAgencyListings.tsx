import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  views_count: number | null;
  total_saves: number;
  images: string[] | null;
  agent_id: string | null;
  primary_agency_id: string | null;
  import_source: string | null;
  merged_source_urls: string[] | null;
  boost_active_until: string | null;
  boosted_by_agency_id: string | null;
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
          property_type, listing_status, verification_status,
          views_count, total_saves, images, agent_id,
          primary_agency_id, import_source, merged_source_urls,
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
            property_type, listing_status, verification_status,
            views_count, total_saves, images, agent_id,
            primary_agency_id, import_source, merged_source_urls,
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
      return rows.map((p) => {
        const isPrimary = p.primary_agency_id === agencyId;
        const boostUntil = p.boost_active_until ? new Date(p.boost_active_until).getTime() : null;
        const hasActiveBoost =
          p.boosted_by_agency_id === agencyId && boostUntil !== null && boostUntil > now;
        return {
          ...p,
          inquiries_count: totalMap[p.id] || 0,
          my_inquiries_count: myMap[p.id] || 0,
          role: isPrimary ? 'primary' : 'co_listed',
          other_agencies_count: otherAgenciesMap[p.id]?.size || 0,
          has_active_boost: hasActiveBoost,
        };
      }) as AgencyListing[];
    },
    enabled: !!agencyId,
  });
}
