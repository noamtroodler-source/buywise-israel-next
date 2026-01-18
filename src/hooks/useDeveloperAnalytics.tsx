import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperProfile } from './useDeveloperProfile';

interface ProjectAnalytics {
  projectId: string;
  views: number;
  inquiries: number;
}

interface DeveloperAnalyticsData {
  totalViews: number;
  totalInquiries: number;
  totalUnits: number;
  availableUnits: number;
  conversionRate: number;
  projectAnalytics: ProjectAnalytics[];
  inquiriesByUnitType: Record<string, number>;
  inquiriesByBudget: Record<string, number>;
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
          totalUnits: 0,
          availableUnits: 0,
          conversionRate: 0,
          projectAnalytics: [],
          inquiriesByUnitType: {},
          inquiriesByBudget: {},
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
        .select('id, views_count, total_units, available_units')
        .eq('developer_id', developerProfile.id);

      if (projectsError) throw projectsError;

      const projectIds = projects?.map(p => p.id) || [];
      
      if (projectIds.length === 0) {
        return {
          totalViews: 0,
          totalInquiries: 0,
          totalUnits: 0,
          availableUnits: 0,
          conversionRate: 0,
          projectAnalytics: [],
          inquiriesByUnitType: {},
          inquiriesByBudget: {},
        };
      }

      // Calculate total units
      const totalUnits = projects?.reduce((sum, p) => sum + (p.total_units || 0), 0) || 0;
      const availableUnits = projects?.reduce((sum, p) => sum + (p.available_units || 0), 0) || 0;

      // Fetch inquiries for developer's projects with optional date filter
      let inquiriesQuery = supabase
        .from('project_inquiries')
        .select('project_id, preferred_unit_type, budget_range, created_at')
        .eq('developer_id', developerProfile.id);
      
      if (dateFilter) {
        inquiriesQuery = inquiriesQuery.gte('created_at', dateFilter);
      }
      
      const { data: inquiries, error: inquiriesError } = await inquiriesQuery;
      if (inquiriesError) throw inquiriesError;

      // For views, query project_views if date filtering is enabled
      let totalViews = 0;
      let viewsByProject: Record<string, number> = {};
      
      if (dateFilter) {
        const { data: viewsData, error: viewsError } = await supabase
          .from('project_views')
          .select('project_id')
          .in('project_id', projectIds)
          .gte('created_at', dateFilter);
        
        if (viewsError) throw viewsError;
        
        viewsData?.forEach(v => {
          viewsByProject[v.project_id] = (viewsByProject[v.project_id] || 0) + 1;
        });
        totalViews = viewsData?.length || 0;
      } else {
        totalViews = projects?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
        projects?.forEach(p => {
          viewsByProject[p.id] = p.views_count || 0;
        });
      }

      const totalInquiries = inquiries?.length || 0;
      const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

      // Group by project
      const projectAnalytics: ProjectAnalytics[] = projectIds.map(projectId => ({
        projectId,
        views: viewsByProject[projectId] || 0,
        inquiries: inquiries?.filter(i => i.project_id === projectId).length || 0,
      }));

      // Group inquiries by unit type
      const inquiriesByUnitType: Record<string, number> = {};
      inquiries?.forEach(i => {
        const unitType = i.preferred_unit_type || 'Not specified';
        inquiriesByUnitType[unitType] = (inquiriesByUnitType[unitType] || 0) + 1;
      });

      // Group inquiries by budget range
      const inquiriesByBudget: Record<string, number> = {};
      inquiries?.forEach(i => {
        const budget = i.budget_range || 'Not specified';
        inquiriesByBudget[budget] = (inquiriesByBudget[budget] || 0) + 1;
      });

      return {
        totalViews,
        totalInquiries,
        totalUnits,
        availableUnits,
        conversionRate,
        projectAnalytics,
        inquiriesByUnitType,
        inquiriesByBudget,
      };
    },
    enabled: !!developerProfile,
  });
}
