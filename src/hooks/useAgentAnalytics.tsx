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
    call: number;
    email: number;
    form: number;
  };
}

export function useAgentAnalytics() {
  const { data: agentProfile } = useAgentProfile();

  return useQuery({
    queryKey: ['agent-analytics', agentProfile?.id],
    queryFn: async (): Promise<AgentAnalyticsData> => {
      if (!agentProfile) {
        return {
          totalViews: 0,
          totalSaves: 0,
          totalInquiries: 0,
          conversionRate: 0,
          propertyAnalytics: [],
          inquiriesByType: { whatsapp: 0, call: 0, email: 0, form: 0 },
        };
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
          inquiriesByType: { whatsapp: 0, call: 0, email: 0, form: 0 },
        };
      }

      // Fetch favorites (saves) for agent's properties
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('property_id')
        .in('property_id', propertyIds);

      if (favoritesError) throw favoritesError;

      // Fetch inquiries for agent's properties
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('property_inquiries')
        .select('property_id, inquiry_type')
        .eq('agent_id', agentProfile.id);

      if (inquiriesError) throw inquiriesError;

      // Calculate totals
      const totalViews = properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
      const totalSaves = favorites?.length || 0;
      const totalInquiries = inquiries?.length || 0;
      const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

      // Group by property
      const propertyAnalytics: PropertyAnalytics[] = propertyIds.map(propertyId => ({
        propertyId,
        views: properties?.find(p => p.id === propertyId)?.views_count || 0,
        saves: favorites?.filter(f => f.property_id === propertyId).length || 0,
        inquiries: inquiries?.filter(i => i.property_id === propertyId).length || 0,
      }));

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
        propertyAnalytics,
        inquiriesByType,
      };
    },
    enabled: !!agentProfile,
  });
}
