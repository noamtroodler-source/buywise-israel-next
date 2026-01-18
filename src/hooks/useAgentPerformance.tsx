import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface AgentPerformanceData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  agencyName: string | null;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
  conversionRate: number;
  responseRate: number;
}

export interface AgentPerformanceStats {
  agents: AgentPerformanceData[];
  statusBreakdown: {
    status: string;
    count: number;
  }[];
  totalAgents: number;
  pendingAgents: number;
  avgListingsPerAgent: number;
  avgInquiriesPerAgent: number;
}

export function useAgentPerformance(days: number = 30) {
  return useQuery({
    queryKey: ['agent-performance', days],
    queryFn: async (): Promise<AgentPerformanceStats> => {
      const startDate = subDays(new Date(), days);
      const startDateStr = startDate.toISOString();

      // Get all agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, email, avatar_url, status, agency_name')
        .order('name');

      if (!agents || agents.length === 0) {
        return {
          agents: [],
          statusBreakdown: [],
          totalAgents: 0,
          pendingAgents: 0,
          avgListingsPerAgent: 0,
          avgInquiriesPerAgent: 0,
        };
      }

      // Get properties for each agent
      const { data: properties } = await supabase
        .from('properties')
        .select('id, agent_id, views_count, listing_status');

      // Get inquiries in date range
      const { data: inquiries } = await supabase
        .from('property_inquiries')
        .select('agent_id, is_read, contacted_at')
        .gte('created_at', startDateStr);

      // Build agent performance data
      const agentData: AgentPerformanceData[] = agents.map(agent => {
        const agentProperties = (properties || []).filter(p => p.agent_id === agent.id);
        const activeListings = agentProperties.filter(p => 
          p.listing_status === 'for_sale' || p.listing_status === 'for_rent'
        ).length;
        const totalViews = agentProperties.reduce((sum, p) => sum + (p.views_count || 0), 0);
        
        const agentInquiries = (inquiries || []).filter(i => i.agent_id === agent.id);
        const totalInquiries = agentInquiries.length;
        const respondedInquiries = agentInquiries.filter(i => i.contacted_at !== null).length;

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          avatarUrl: agent.avatar_url,
          status: agent.status,
          agencyName: agent.agency_name,
          activeListings,
          totalViews,
          totalInquiries,
          conversionRate: totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0,
          responseRate: totalInquiries > 0 ? (respondedInquiries / totalInquiries) * 100 : 0,
        };
      });

      // Sort by total views (performance)
      agentData.sort((a, b) => b.totalViews - a.totalViews);

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      agents.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });

      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }));

      const totalListings = agentData.reduce((sum, a) => sum + a.activeListings, 0);
      const totalInquiriesAll = agentData.reduce((sum, a) => sum + a.totalInquiries, 0);

      return {
        agents: agentData,
        statusBreakdown,
        totalAgents: agents.length,
        pendingAgents: statusCounts['pending'] || 0,
        avgListingsPerAgent: agents.length > 0 ? totalListings / agents.length : 0,
        avgInquiriesPerAgent: agents.length > 0 ? totalInquiriesAll / agents.length : 0,
      };
    },
  });
}
