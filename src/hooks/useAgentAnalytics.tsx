import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAgentProfile } from './useAgentProperties';

interface PropertyAnalytics {
  propertyId: string;
  views: number;
  saves: number;
  inquiries: number;
}

interface AgentAnalyticsData {
  totalViews: number;
  totalSaves: number;
  totalInquiries: number;
  conversionRate: number;
  propertyAnalytics: PropertyAnalytics[];
  inquiriesByType: {
    whatsapp: number;
    email: number;
    form: number;
  };
}

export type DateRangeFilter = '7d' | '30d' | '90d' | 'all';

export function useAgentAnalytics(dateRange: DateRangeFilter = 'all') {
  const { data: agentProfile } = useAgentProfile();

  return useQuery({
    queryKey: ['agent-analytics', agentProfile?.id, dateRange],
    queryFn: async (): Promise<AgentAnalyticsData> => {
      if (!agentProfile) {
        return {
          totalViews: 0,
          totalSaves: 0,
          totalInquiries: 0,
          conversionRate: 0,
          propertyAnalytics: [],
          inquiriesByType: { whatsapp: 0, email: 0, form: 0 },
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

      // Fetch agent's properties with views
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, views_count')
        .eq('agent_id', agentProfile.id);

      if (propertiesError) throw propertiesError;

      const propertyIds = properties?.map(p => p.id) || [];
      
      if (propertyIds.length === 0) {
        return {
          totalViews: 0,
          totalSaves: 0,
          totalInquiries: 0,
          conversionRate: 0,
          propertyAnalytics: [],
          inquiriesByType: { whatsapp: 0, email: 0, form: 0 },
        };
      }

      // Fetch favorites (saves) for agent's properties with optional date filter
      let favoritesQuery = supabase
        .from('favorites')
        .select('property_id, created_at')
        .in('property_id', propertyIds);
      
      if (dateFilter) {
        favoritesQuery = favoritesQuery.gte('created_at', dateFilter);
      }
      
      const { data: favorites, error: favoritesError } = await favoritesQuery;
      if (favoritesError) throw favoritesError;

      // Fetch inquiries for agent's properties with optional date filter
      let inquiriesQuery = supabase
        .from('property_inquiries')
        .select('property_id, inquiry_type, created_at')
        .eq('agent_id', agentProfile.id);
      
      if (dateFilter) {
        inquiriesQuery = inquiriesQuery.gte('created_at', dateFilter);
      }
      
      const { data: inquiries, error: inquiriesError } = await inquiriesQuery;
      if (inquiriesError) throw inquiriesError;

      // For views, we need to query property_views if date filtering is enabled
      let totalViews = 0;
      let viewsByProperty: Record<string, number> = {};
      
      if (dateFilter) {
        // Use property_views table for date-filtered view counts
        const { data: viewsData, error: viewsError } = await supabase
          .from('property_views')
          .select('property_id')
          .in('property_id', propertyIds)
          .gte('viewed_at', dateFilter);
        
        if (viewsError) throw viewsError;
        
        // Count views per property
        viewsData?.forEach(v => {
          viewsByProperty[v.property_id] = (viewsByProperty[v.property_id] || 0) + 1;
        });
        totalViews = viewsData?.length || 0;
      } else {
        // Use views_count from properties table for all-time
        totalViews = properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
        properties?.forEach(p => {
          viewsByProperty[p.id] = p.views_count || 0;
        });
      }

      const totalSaves = favorites?.length || 0;
      const totalInquiries = inquiries?.length || 0;
      const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

      // Group by property
      const propertyAnalytics: PropertyAnalytics[] = propertyIds.map(propertyId => ({
        propertyId,
        views: viewsByProperty[propertyId] || 0,
        saves: favorites?.filter(f => f.property_id === propertyId).length || 0,
        inquiries: inquiries?.filter(i => i.property_id === propertyId).length || 0,
      }));

      // Group inquiries by type
      const inquiriesByType = {
        whatsapp: inquiries?.filter(i => i.inquiry_type === 'whatsapp').length || 0,
        email: inquiries?.filter(i => i.inquiry_type === 'email').length || 0,
        form: inquiries?.filter(i => i.inquiry_type === 'form').length || 0,
      };

      return {
        totalViews,
        totalSaves,
        totalInquiries,
        conversionRate,
        propertyAnalytics,
        inquiriesByType,
      };
    },
    enabled: !!agentProfile,
  });
}
