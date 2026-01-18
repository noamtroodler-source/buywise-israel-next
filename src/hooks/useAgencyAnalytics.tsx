import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyAgency } from './useAgencyManagement';
import { DateRangeFilter } from './useAgentAnalytics';

interface AgentPerformance {
  agentId: string;
  agentName: string;
  avatarUrl: string | null;
  views: number;
  saves: number;
  inquiries: number;
  activeListings: number;
}

interface AgencyAnalyticsData {
  totalViews: number;
  totalSaves: number;
  totalInquiries: number;
  conversionRate: number;
  agentPerformance: AgentPerformance[];
  inquiriesByType: {
    whatsapp: number;
    call: number;
    email: number;
    form: number;
  };
}

export function useAgencyAnalytics(dateRange: DateRangeFilter = 'all') {
  const { data: agency } = useMyAgency();

  return useQuery({
    queryKey: ['agency-analytics', agency?.id, dateRange],
    queryFn: async (): Promise<AgencyAnalyticsData> => {
      if (!agency) {
        return {
          totalViews: 0,
          totalSaves: 0,
          totalInquiries: 0,
          conversionRate: 0,
          agentPerformance: [],
          inquiriesByType: { whatsapp: 0, call: 0, email: 0, form: 0 },
        };
      }

      // Calculate date filter
      let dateFilter: string | null = null;
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        dateFilter = cutoffDate.toISOString();
      }

      // Get all agents in agency
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, avatar_url')
        .eq('agency_id', agency.id);

      if (agentsError) throw agentsError;

      const agentIds = agents?.map(a => a.id) || [];
      
      if (agentIds.length === 0) {
        return {
          totalViews: 0,
          totalSaves: 0,
          totalInquiries: 0,
          conversionRate: 0,
          agentPerformance: [],
          inquiriesByType: { whatsapp: 0, call: 0, email: 0, form: 0 },
        };
      }

      // Fetch all properties for agency agents
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, agent_id, views_count, verification_status')
        .in('agent_id', agentIds);

      if (propertiesError) throw propertiesError;

      const propertyIds = properties?.map(p => p.id) || [];

      // Fetch favorites with optional date filter
      let favoritesQuery = supabase
        .from('favorites')
        .select('property_id, created_at')
        .in('property_id', propertyIds);
      
      if (dateFilter) {
        favoritesQuery = favoritesQuery.gte('created_at', dateFilter);
      }
      
      const { data: favorites, error: favoritesError } = await favoritesQuery;
      if (favoritesError) throw favoritesError;

      // Fetch inquiries with optional date filter
      let inquiriesQuery = supabase
        .from('property_inquiries')
        .select('property_id, agent_id, inquiry_type, created_at')
        .in('agent_id', agentIds);
      
      if (dateFilter) {
        inquiriesQuery = inquiriesQuery.gte('created_at', dateFilter);
      }
      
      const { data: inquiries, error: inquiriesError } = await inquiriesQuery;
      if (inquiriesError) throw inquiriesError;

      // Get views (with date filter if applicable)
      let totalViews = 0;
      let viewsByAgent: Record<string, number> = {};

      if (dateFilter) {
        const { data: viewsData, error: viewsError } = await supabase
          .from('property_views')
          .select('property_id')
          .in('property_id', propertyIds)
          .gte('viewed_at', dateFilter);
        
        if (viewsError) throw viewsError;
        
        viewsData?.forEach(v => {
          const property = properties?.find(p => p.id === v.property_id);
          if (property) {
            viewsByAgent[property.agent_id] = (viewsByAgent[property.agent_id] || 0) + 1;
          }
        });
        totalViews = viewsData?.length || 0;
      } else {
        properties?.forEach(p => {
          viewsByAgent[p.agent_id] = (viewsByAgent[p.agent_id] || 0) + (p.views_count || 0);
        });
        totalViews = properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
      }

      const totalSaves = favorites?.length || 0;
      const totalInquiries = inquiries?.length || 0;
      const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

      // Build per-agent performance
      const agentPerformance: AgentPerformance[] = agents?.map(agent => {
        const agentProperties = properties?.filter(p => p.agent_id === agent.id) || [];
        const agentPropertyIds = agentProperties.map(p => p.id);
        
        return {
          agentId: agent.id,
          agentName: agent.name,
          avatarUrl: agent.avatar_url,
          views: viewsByAgent[agent.id] || 0,
          saves: favorites?.filter(f => agentPropertyIds.includes(f.property_id)).length || 0,
          inquiries: inquiries?.filter(i => i.agent_id === agent.id).length || 0,
          activeListings: agentProperties.filter(p => (p as any).verification_status === 'approved').length,
        };
      }) || [];

      // Sort by views descending
      agentPerformance.sort((a, b) => b.views - a.views);

      // Group inquiries by type
      const inquiriesByType = {
        whatsapp: inquiries?.filter(i => i.inquiry_type === 'whatsapp').length || 0,
        call: inquiries?.filter(i => i.inquiry_type === 'call').length || 0,
        email: inquiries?.filter(i => i.inquiry_type === 'email').length || 0,
        form: inquiries?.filter(i => i.inquiry_type === 'form').length || 0,
      };

      return {
        totalViews,
        totalSaves,
        totalInquiries,
        conversionRate,
        agentPerformance,
        inquiriesByType,
      };
    },
    enabled: !!agency,
  });
}
