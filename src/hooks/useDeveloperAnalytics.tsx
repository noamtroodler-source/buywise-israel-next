import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperProfile } from './useDeveloperProfile';

export interface ProjectEngagement {
  projectId: string;
  name: string;
  city: string;
  image: string | null;
  views: number;
  saves: number;
  clicks: number;
}

interface DeveloperAnalyticsData {
  totalViews: number;
  totalInquiries: number;
  totalSaves: number;
  whatsappClicks: number;
  emailClicks: number;
  formClicks: number;
  hourlyDistribution: { hour: number; count: number }[];
  projectEngagement: ProjectEngagement[];
}

export type DateRangeFilter = '7d' | '30d' | '90d' | 'all';

export function useDeveloperAnalytics(dateRange: DateRangeFilter = 'all') {
  const { data: developerProfile } = useDeveloperProfile();

  return useQuery({
    queryKey: ['developer-analytics', developerProfile?.id, dateRange],
    queryFn: async (): Promise<DeveloperAnalyticsData> => {
      if (!developerProfile) {
        return {
          totalViews: 0,
          totalInquiries: 0,
          totalSaves: 0,
          whatsappClicks: 0,
          emailClicks: 0,
          formClicks: 0,
          hourlyDistribution: [],
          projectEngagement: [],
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

      // Fetch developer's projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, city, images, views_count')
        .eq('developer_id', developerProfile.id);

      if (projectsError) throw projectsError;

      const projectIds = projects?.map(p => p.id) || [];
      
      if (projectIds.length === 0) {
        return {
          totalViews: 0,
          totalInquiries: 0,
          totalSaves: 0,
          whatsappClicks: 0,
          emailClicks: 0,
          formClicks: 0,
          hourlyDistribution: [],
          projectEngagement: [],
        };
      }

      // Fetch inquiries for developer's projects with optional date filter
      let inquiriesQuery = supabase
        .from('project_inquiries')
        .select('id, project_id, created_at, response_method')
        .eq('developer_id', developerProfile.id);
      
      if (dateFilter) {
        inquiriesQuery = inquiriesQuery.gte('created_at', dateFilter);
      }
      
      const { data: inquiries, error: inquiriesError } = await inquiriesQuery;
      if (inquiriesError) throw inquiriesError;

      // Count by response method (whatsapp, email, form) and build hourly distribution
      const typeCounts = { whatsapp: 0, email: 0, form: 0 };
      const hourCounts: Record<number, number> = {};
      const projectClickCounts: Record<string, number> = {};

      (inquiries || []).forEach((inq) => {
        // Count by response_method (if tracked)
        const method = inq.response_method?.toLowerCase() || 'form';
        if (method === 'whatsapp') {
          typeCounts.whatsapp++;
        } else if (method === 'email') {
          typeCounts.email++;
        } else {
          typeCounts.form++;
        }

        // Count by hour
        const hour = new Date(inq.created_at || '').getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;

        // Count by project
        if (inq.project_id) {
          projectClickCounts[inq.project_id] = (projectClickCounts[inq.project_id] || 0) + 1;
        }
      });

      // Build hourly distribution
      const hourlyDistribution = [];
      for (let h = 6; h <= 23; h++) {
        hourlyDistribution.push({ hour: h, count: hourCounts[h] || 0 });
      }
      for (let h = 0; h < 6; h++) {
        hourlyDistribution.push({ hour: h, count: hourCounts[h] || 0 });
      }

      // Fetch saves count per project (from project_favorites)
      const { data: saves } = await supabase
        .from('project_favorites')
        .select('project_id')
        .in('project_id', projectIds);

      const saveCounts: Record<string, number> = {};
      (saves || []).forEach((s) => {
        saveCounts[s.project_id] = (saveCounts[s.project_id] || 0) + 1;
      });

      // Calculate totals
      const totalViews = projects?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
      const totalSaves = saves?.length || 0;
      const totalInquiries = inquiries?.length || 0;

      // Build project engagement array
      const projectEngagement: ProjectEngagement[] = (projects || [])
        .map((p) => ({
          projectId: p.id,
          name: p.name,
          city: p.city,
          image: p.images?.[0] || null,
          views: p.views_count || 0,
          saves: saveCounts[p.id] || 0,
          clicks: projectClickCounts[p.id] || 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      return {
        totalViews,
        totalInquiries,
        totalSaves,
        whatsappClicks: typeCounts.whatsapp,
        emailClicks: typeCounts.email,
        formClicks: typeCounts.form,
        hourlyDistribution,
        projectEngagement,
      };
    },
    enabled: !!developerProfile,
  });
}
