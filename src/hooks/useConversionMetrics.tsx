import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface ConversionMetrics {
  totalViews: number;
  totalSaves: number;
  totalInquiries: number;
  viewsToSavesRate: number;
  viewsToInquiriesRate: number;
  savesToInquiriesRate: number;
  avgResponseTimeHours: number | null;
  inquiriesContacted: number;
  inquiryContactRate: number;
}

export function useConversionMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['conversion-metrics', days],
    queryFn: async (): Promise<ConversionMetrics> => {
      const startDate = subDays(new Date(), days);
      const startDateStr = startDate.toISOString();

      const [
        { count: totalViews },
        { count: totalSaves },
        { count: totalInquiries },
        { data: contactedInquiries },
      ] = await Promise.all([
        supabase
          .from('property_views')
          .select('*', { count: 'exact', head: true })
          .gte('viewed_at', startDateStr),
        supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDateStr),
        supabase
          .from('property_inquiries')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDateStr),
        supabase
          .from('property_inquiries')
          .select('created_at, contacted_at')
          .gte('created_at', startDateStr)
          .not('contacted_at', 'is', null),
      ]);

      const views = totalViews || 0;
      const saves = totalSaves || 0;
      const inquiries = totalInquiries || 0;
      const contacted = contactedInquiries?.length || 0;

      // Calculate response times
      let avgResponseTimeHours: number | null = null;
      if (contactedInquiries && contactedInquiries.length > 0) {
        const responseTimes = contactedInquiries
          .filter(inq => inq.created_at && inq.contacted_at)
          .map(inq => {
            const created = new Date(inq.created_at!).getTime();
            const contacted = new Date(inq.contacted_at!).getTime();
            return (contacted - created) / (1000 * 60 * 60); // hours
          });
        
        if (responseTimes.length > 0) {
          avgResponseTimeHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }
      }

      return {
        totalViews: views,
        totalSaves: saves,
        totalInquiries: inquiries,
        viewsToSavesRate: views > 0 ? (saves / views) * 100 : 0,
        viewsToInquiriesRate: views > 0 ? (inquiries / views) * 100 : 0,
        savesToInquiriesRate: saves > 0 ? (inquiries / saves) * 100 : 0,
        avgResponseTimeHours,
        inquiriesContacted: contacted,
        inquiryContactRate: inquiries > 0 ? (contacted / inquiries) * 100 : 0,
      };
    },
  });
}
