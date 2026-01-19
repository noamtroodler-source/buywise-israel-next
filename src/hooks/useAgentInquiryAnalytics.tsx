import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InquiryAnalytics {
  totalClicks: number;
  whatsappClicks: number;
  callClicks: number;
  emailClicks: number;
  formClicks: number;
  hourlyDistribution: { hour: number; count: number }[];
  propertyEngagement: {
    propertyId: string;
    title: string;
    city: string;
    image: string | null;
    views: number;
    saves: number;
    clicks: number;
  }[];
}

export function useAgentInquiryAnalytics(dateRange: '7d' | '30d' | '90d' | 'all' = '30d') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-inquiry-analytics', user?.id, dateRange],
    queryFn: async (): Promise<InquiryAnalytics> => {
      // Get agent ID
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (agentError || !agent) {
        throw new Error('Agent not found');
      }

      // Calculate date filter
      let dateFilter: string | null = null;
      const now = new Date();
      if (dateRange === '7d') {
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '30d') {
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '90d') {
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Fetch inquiries
      let inquiriesQuery = supabase
        .from('property_inquiries')
        .select('id, inquiry_type, created_at, property_id')
        .eq('agent_id', agent.id);

      if (dateFilter) {
        inquiriesQuery = inquiriesQuery.gte('created_at', dateFilter);
      }

      const { data: inquiries, error: inquiriesError } = await inquiriesQuery;
      if (inquiriesError) throw inquiriesError;

      // Count by type
      const typeCounts = {
        whatsapp: 0,
        call: 0,
        email: 0,
        form: 0,
      };

      const hourCounts: Record<number, number> = {};
      const propertyClickCounts: Record<string, number> = {};

      (inquiries || []).forEach((inq) => {
        // Count by type
        const type = inq.inquiry_type?.toLowerCase() || 'form';
        if (type in typeCounts) {
          typeCounts[type as keyof typeof typeCounts]++;
        } else {
          typeCounts.form++;
        }

        // Count by hour
        const hour = new Date(inq.created_at || '').getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;

        // Count by property
        if (inq.property_id) {
          propertyClickCounts[inq.property_id] = (propertyClickCounts[inq.property_id] || 0) + 1;
        }
      });

      // Build hourly distribution (6am to 11pm)
      const hourlyDistribution = [];
      for (let h = 6; h <= 23; h++) {
        hourlyDistribution.push({ hour: h, count: hourCounts[h] || 0 });
      }
      // Add early morning hours (0-5)
      for (let h = 0; h < 6; h++) {
        hourlyDistribution.push({ hour: h, count: hourCounts[h] || 0 });
      }

      // Fetch properties with engagement data
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, city, images, views_count')
        .eq('agent_id', agent.id);

      // Fetch saves count per property
      const propertyIds = (properties || []).map((p) => p.id);
      const { data: saves } = await supabase
        .from('favorites')
        .select('property_id')
        .in('property_id', propertyIds);

      const saveCounts: Record<string, number> = {};
      (saves || []).forEach((s) => {
        saveCounts[s.property_id] = (saveCounts[s.property_id] || 0) + 1;
      });

      // Build property engagement array
      const propertyEngagement = (properties || [])
        .map((p) => ({
          propertyId: p.id,
          title: p.title,
          city: p.city,
          image: p.images?.[0] || null,
          views: p.views_count || 0,
          saves: saveCounts[p.id] || 0,
          clicks: propertyClickCounts[p.id] || 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      return {
        totalClicks: inquiries?.length || 0,
        whatsappClicks: typeCounts.whatsapp,
        callClicks: typeCounts.call,
        emailClicks: typeCounts.email,
        formClicks: typeCounts.form,
        hourlyDistribution,
        propertyEngagement,
      };
    },
    enabled: !!user?.id,
  });
}
