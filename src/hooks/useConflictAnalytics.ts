/**
 * useConflictAnalytics — Aggregates cross-agency conflict patterns for the
 * admin analytics dashboard: top offenders, resolution time, auto-resolve rate,
 * detection-method breakdown.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConflictAnalytics {
  total: number;
  pending: number;
  resolved: number;
  autoResolved: number;
  autoResolveRate: number;
  avgResolutionHours: number | null;
  byStatus: Record<string, number>;
  byAgency: Array<{ agency_id: string; agency_name: string; conflict_count: number }>;
  bySource: Record<string, number>;
  recentTrend: Array<{ day: string; count: number }>;
}

export function useConflictAnalytics() {
  return useQuery({
    queryKey: ['conflict-analytics'],
    queryFn: async (): Promise<ConflictAnalytics> => {
      const { data: conflicts, error } = await supabase
        .from('cross_agency_conflicts')
        .select('id, status, attempted_source_type, created_at, resolved_at, attempted_agency_id, existing_agency_id, auto_resolved')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      const list = (conflicts || []) as any[];

      const byStatus: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const byAgencyId: Record<string, number> = {};
      let resolutionTotalMs = 0;
      let resolutionCount = 0;
      let autoResolvedCount = 0;

      for (const c of list) {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        if (c.attempted_source_type) bySource[c.attempted_source_type] = (bySource[c.attempted_source_type] || 0) + 1;
        if (c.auto_resolved) autoResolvedCount += 1;
        if (c.resolved_at && c.created_at) {
          resolutionTotalMs += new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
          resolutionCount += 1;
        }
        // Each agency in the conflict gets a tally
        if (c.attempted_agency_id) byAgencyId[c.attempted_agency_id] = (byAgencyId[c.attempted_agency_id] || 0) + 1;
        if (c.existing_agency_id) byAgencyId[c.existing_agency_id] = (byAgencyId[c.existing_agency_id] || 0) + 1;
      }

      // Resolve agency names
      const agencyIds = Object.keys(byAgencyId);
      let byAgency: ConflictAnalytics['byAgency'] = [];
      if (agencyIds.length > 0) {
        const { data: agencies } = await supabase
          .from('agencies')
          .select('id, name')
          .in('id', agencyIds);
        const nameMap = new Map((agencies || []).map((a: any) => [a.id, a.name]));
        byAgency = agencyIds
          .map((id) => ({
            agency_id: id,
            agency_name: nameMap.get(id) || 'Unknown agency',
            conflict_count: byAgencyId[id],
          }))
          .sort((a, b) => b.conflict_count - a.conflict_count)
          .slice(0, 10);
      }

      // Recent trend: last 14 days
      const trendMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        trendMap[d.toISOString().slice(0, 10)] = 0;
      }
      for (const c of list) {
        const day = new Date(c.created_at).toISOString().slice(0, 10);
        if (day in trendMap) trendMap[day] += 1;
      }
      const recentTrend = Object.entries(trendMap).map(([day, count]) => ({ day, count }));

      return {
        total: list.length,
        pending: byStatus['pending'] || 0,
        resolved: list.length - (byStatus['pending'] || 0),
        autoResolved: autoResolvedCount,
        autoResolveRate: list.length > 0 ? (autoResolvedCount / list.length) * 100 : 0,
        avgResolutionHours: resolutionCount > 0
          ? Math.round((resolutionTotalMs / resolutionCount) / (1000 * 60 * 60) * 10) / 10
          : null,
        byStatus,
        byAgency,
        bySource,
        recentTrend,
      };
    },
    staleTime: 60_000,
  });
}
