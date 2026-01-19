import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

interface PersonalPerformanceMetrics {
  viewsThisWeek: number;
  viewsLastWeek: number;
  inquiriesThisWeek: number;
  inquiriesLastWeek: number;
  listingsActive: number;
  listingsLastWeek: number;
  conversionRate: number;
  conversionRateLastWeek: number;
  topListingTitle: string | null;
  topListingId: string | null;
}

export function useMyAgentPerformance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-agent-performance', user?.id],
    queryFn: async (): Promise<PersonalPerformanceMetrics> => {
      // Get the agent
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!agent) {
        return {
          viewsThisWeek: 0,
          viewsLastWeek: 0,
          inquiriesThisWeek: 0,
          inquiriesLastWeek: 0,
          listingsActive: 0,
          listingsLastWeek: 0,
          conversionRate: 0,
          conversionRateLastWeek: 0,
          topListingTitle: null,
          topListingId: null,
        };
      }

      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });

      // Get agent's property IDs
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, views_count')
        .eq('agent_id', agent.id);

      const propertyIds = properties?.map((p) => p.id) || [];

      // Active listings count
      const { count: activeListings } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('listing_status', 'for_sale');

      // Views this week
      const { count: viewsThisWeek } = await supabase
        .from('property_views')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds.length > 0 ? propertyIds : ['none'])
        .gte('viewed_at', thisWeekStart.toISOString());

      // Views last week
      const { count: viewsLastWeek } = await supabase
        .from('property_views')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds.length > 0 ? propertyIds : ['none'])
        .gte('viewed_at', lastWeekStart.toISOString())
        .lte('viewed_at', lastWeekEnd.toISOString());

      // Inquiries this week
      const { count: inquiriesThisWeek } = await supabase
        .from('property_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .gte('created_at', thisWeekStart.toISOString());

      // Inquiries last week
      const { count: inquiriesLastWeek } = await supabase
        .from('property_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .gte('created_at', lastWeekStart.toISOString())
        .lte('created_at', lastWeekEnd.toISOString());

      // Find top performing listing (by views)
      const topListing = properties?.reduce((top, current) => {
        if (!top || (current.views_count || 0) > (top.views_count || 0)) {
          return current;
        }
        return top;
      }, null as (typeof properties)[0] | null);

      // Calculate conversion rates
      const conversionRate = (viewsThisWeek || 0) > 0 
        ? ((inquiriesThisWeek || 0) / (viewsThisWeek || 1)) * 100 
        : 0;
      
      const conversionRateLastWeek = (viewsLastWeek || 0) > 0 
        ? ((inquiriesLastWeek || 0) / (viewsLastWeek || 1)) * 100 
        : 0;

      return {
        viewsThisWeek: viewsThisWeek || 0,
        viewsLastWeek: viewsLastWeek || 0,
        inquiriesThisWeek: inquiriesThisWeek || 0,
        inquiriesLastWeek: inquiriesLastWeek || 0,
        listingsActive: activeListings || 0,
        listingsLastWeek: activeListings || 0, // Simplified - could track historical
        conversionRate,
        conversionRateLastWeek,
        topListingTitle: topListing?.title || null,
        topListingId: topListing?.id || null,
      };
    },
    enabled: !!user?.id,
  });
}

// Hook for agency-level leaderboard
export function useAgencyLeaderboard(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency-leaderboard', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      // Get all agents in the agency
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, avatar_url')
        .eq('agency_id', agencyId)
        .eq('status', 'active');

      if (!agents || agents.length === 0) return [];

      // Get metrics for each agent
      const agentMetrics = await Promise.all(
        agents.map(async (agent) => {
          // Get property count and views
          const { data: properties } = await supabase
            .from('properties')
            .select('id, views_count')
            .eq('agent_id', agent.id)
            .eq('listing_status', 'for_sale');

          const listingsCount = properties?.length || 0;
          const viewsCount = properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

          // Get inquiry count
          const { count: inquiriesCount } = await supabase
            .from('property_inquiries')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agent.id);

          const conversionRate = viewsCount > 0 
            ? ((inquiriesCount || 0) / viewsCount) * 100 
            : 0;

          return {
            id: agent.id,
            name: agent.name,
            avatar_url: agent.avatar_url,
            listings_count: listingsCount,
            views_count: viewsCount,
            inquiries_count: inquiriesCount || 0,
            conversion_rate: conversionRate,
          };
        })
      );

      return agentMetrics;
    },
    enabled: !!agencyId,
  });
}
