import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

export interface PlatformStats {
  totalUsers: number;
  totalProperties: number;
  totalAgents: number;
  totalProjects: number;
  totalDevelopers: number;
  totalAgencies: number;
  totalBlogPosts: number;
  totalCities: number;
  pendingAgents: number;
  pendingListings: number;
  pendingProjects: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalViews7d: number;
  totalInquiries7d: number;
}

export interface ViewsTrendData {
  date: string;
  views: number;
}

export interface InquiryBreakdown {
  type: string;
  count: number;
}

export interface TopProperty {
  id: string;
  title: string;
  city: string;
  views: number;
  inquiries: number;
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      const today = startOfDay(new Date());
      const weekAgo = subDays(today, 7);

      const [
        { count: totalUsers },
        { count: totalProperties },
        { count: totalAgents },
        { count: totalProjects },
        { count: totalDevelopers },
        { count: totalAgencies },
        { count: totalBlogPosts },
        { count: totalCities },
        { count: pendingAgents },
        { count: pendingListings },
        { count: pendingProjects },
        { count: newUsersToday },
        { count: newUsersThisWeek },
        { count: totalViews7d },
        { count: totalInquiries7d },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('developers').select('*', { count: 'exact', head: true }),
        supabase.from('agencies').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('cities').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending_review'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending_review'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('property_views').select('*', { count: 'exact', head: true }).gte('viewed_at', weekAgo.toISOString()),
        supabase.from('property_inquiries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalProperties: totalProperties || 0,
        totalAgents: totalAgents || 0,
        totalProjects: totalProjects || 0,
        totalDevelopers: totalDevelopers || 0,
        totalAgencies: totalAgencies || 0,
        totalBlogPosts: totalBlogPosts || 0,
        totalCities: totalCities || 0,
        pendingAgents: pendingAgents || 0,
        pendingListings: pendingListings || 0,
        pendingProjects: pendingProjects || 0,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        totalViews7d: totalViews7d || 0,
        totalInquiries7d: totalInquiries7d || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useViewsTrend(days: number = 30) {
  return useQuery({
    queryKey: ['admin-views-trend', days],
    queryFn: async (): Promise<ViewsTrendData[]> => {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('property_views')
        .select('viewed_at')
        .gte('viewed_at', startDate.toISOString())
        .order('viewed_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped: Record<string, number> = {};
      
      // Initialize all dates with 0
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), 'MMM dd');
        grouped[date] = 0;
      }

      // Count views per date
      (data || []).forEach((view) => {
        const date = format(new Date(view.viewed_at!), 'MMM dd');
        if (grouped[date] !== undefined) {
          grouped[date]++;
        }
      });

      return Object.entries(grouped).map(([date, views]) => ({
        date,
        views,
      }));
    },
  });
}

export function useInquiryBreakdown(days: number = 30) {
  return useQuery({
    queryKey: ['admin-inquiry-breakdown', days],
    queryFn: async (): Promise<InquiryBreakdown[]> => {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('property_inquiries')
        .select('inquiry_type')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by type
      const grouped: Record<string, number> = {
        'whatsapp': 0,
        'call': 0,
        'email': 0,
        'form': 0,
      };

      (data || []).forEach((inquiry) => {
        const type = inquiry.inquiry_type?.toLowerCase() || 'form';
        if (grouped[type] !== undefined) {
          grouped[type]++;
        } else {
          grouped['form']++;
        }
      });

      return Object.entries(grouped).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
      }));
    },
  });
}

export function useTopProperties(limit: number = 10) {
  return useQuery({
    queryKey: ['admin-top-properties', limit],
    queryFn: async (): Promise<TopProperty[]> => {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, city, views_count')
        .order('views_count', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;

      // Get inquiry counts for these properties
      const propertyIds = (properties || []).map(p => p.id);
      
      const { data: inquiries } = await supabase
        .from('property_inquiries')
        .select('property_id')
        .in('property_id', propertyIds);

      const inquiryCounts: Record<string, number> = {};
      (inquiries || []).forEach((inq) => {
        inquiryCounts[inq.property_id] = (inquiryCounts[inq.property_id] || 0) + 1;
      });

      return (properties || []).map((p) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        views: p.views_count || 0,
        inquiries: inquiryCounts[p.id] || 0,
      }));
    },
  });
}
