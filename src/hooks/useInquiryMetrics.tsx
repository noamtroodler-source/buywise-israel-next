import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, differenceInHours } from 'date-fns';

export interface InquiryStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface InquiryMetricsData {
  totalInquiries: number;
  unreadCount: number;
  contactedCount: number;
  avgResponseTimeHours: number | null;
  statusBreakdown: InquiryStatusData[];
  overdueCount: number; // Not contacted within 24 hours
  typeBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

export function useInquiryMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['inquiry-metrics', days],
    queryFn: async (): Promise<InquiryMetricsData> => {
      const startDate = subDays(new Date(), days);
      const now = new Date();

      const { data: inquiries } = await supabase
        .from('property_inquiries')
        .select('id, is_read, status, inquiry_type, created_at, contacted_at')
        .gte('created_at', startDate.toISOString());

      if (!inquiries || inquiries.length === 0) {
        return {
          totalInquiries: 0,
          unreadCount: 0,
          contactedCount: 0,
          avgResponseTimeHours: null,
          statusBreakdown: [],
          overdueCount: 0,
          typeBreakdown: [],
        };
      }

      const totalInquiries = inquiries.length;
      const unreadCount = inquiries.filter(i => !i.is_read).length;
      const contactedCount = inquiries.filter(i => i.contacted_at !== null).length;

      // Calculate average response time
      const respondedInquiries = inquiries.filter(i => i.contacted_at !== null && i.created_at);
      let avgResponseTimeHours: number | null = null;
      
      if (respondedInquiries.length > 0) {
        const totalHours = respondedInquiries.reduce((sum, i) => {
          const created = new Date(i.created_at!);
          const contacted = new Date(i.contacted_at!);
          return sum + differenceInHours(contacted, created);
        }, 0);
        avgResponseTimeHours = totalHours / respondedInquiries.length;
      }

      // Count overdue (not contacted within 24 hours)
      const overdueCount = inquiries.filter(i => {
        if (i.contacted_at !== null) return false;
        if (!i.created_at) return false;
        const created = new Date(i.created_at);
        return differenceInHours(now, created) > 24;
      }).length;

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      inquiries.forEach(i => {
        const status = i.status || 'new';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status: formatStatus(status),
        count,
        percentage: (count / totalInquiries) * 100,
      }));

      // Type breakdown
      const typeCounts: Record<string, number> = {};
      inquiries.forEach(i => {
        const type = i.inquiry_type || 'form';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const typeBreakdown = Object.entries(typeCounts).map(([type, count]) => ({
        type: formatType(type),
        count,
        percentage: (count / totalInquiries) * 100,
      }));

      return {
        totalInquiries,
        unreadCount,
        contactedCount,
        avgResponseTimeHours,
        statusBreakdown,
        overdueCount,
        typeBreakdown,
      };
    },
  });
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    closed: 'Closed',
    spam: 'Spam',
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    whatsapp: 'WhatsApp',
    email: 'Email',
    form: 'Contact Form',
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}
