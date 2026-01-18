import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

export interface GrowthMetric {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

export interface GrowthData {
  users: GrowthMetric;
  properties: GrowthMetric;
  inquiries: GrowthMetric;
  views: GrowthMetric;
  agents: GrowthMetric;
}

export interface TrendDataPoint {
  date: string;
  users: number;
  properties: number;
  inquiries: number;
}

export function useGrowthMetrics(periodDays: number = 7) {
  return useQuery({
    queryKey: ['growth-metrics', periodDays],
    queryFn: async (): Promise<GrowthData> => {
      const now = new Date();
      const currentStart = startOfDay(subDays(now, periodDays));
      const previousStart = startOfDay(subDays(now, periodDays * 2));
      const previousEnd = startOfDay(subDays(now, periodDays));

      // Current period counts
      const [
        { count: currentUsers },
        { count: currentProperties },
        { count: currentInquiries },
        { count: currentViews },
        { count: currentAgents },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        supabase.from('properties').select('*', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        supabase.from('property_inquiries').select('*', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        supabase.from('property_views').select('*', { count: 'exact', head: true })
          .gte('viewed_at', currentStart.toISOString()),
        supabase.from('agents').select('*', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
      ]);

      // Previous period counts
      const [
        { count: prevUsers },
        { count: prevProperties },
        { count: prevInquiries },
        { count: prevViews },
        { count: prevAgents },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
        supabase.from('properties').select('*', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
        supabase.from('property_inquiries').select('*', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
        supabase.from('property_views').select('*', { count: 'exact', head: true })
          .gte('viewed_at', previousStart.toISOString())
          .lt('viewed_at', previousEnd.toISOString()),
        supabase.from('agents').select('*', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
      ]);

      const createMetric = (label: string, current: number, previous: number): GrowthMetric => {
        const change = current - previous;
        const changePercent = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0);
        return {
          label,
          current,
          previous,
          change,
          changePercent,
          isPositive: change >= 0,
        };
      };

      return {
        users: createMetric('New Users', currentUsers || 0, prevUsers || 0),
        properties: createMetric('New Listings', currentProperties || 0, prevProperties || 0),
        inquiries: createMetric('Inquiries', currentInquiries || 0, prevInquiries || 0),
        views: createMetric('Views', currentViews || 0, prevViews || 0),
        agents: createMetric('New Agents', currentAgents || 0, prevAgents || 0),
      };
    },
  });
}

export function useCumulativeGrowth(days: number = 30) {
  return useQuery({
    queryKey: ['cumulative-growth', days],
    queryFn: async (): Promise<TrendDataPoint[]> => {
      const startDate = subDays(new Date(), days);

      const [
        { data: users },
        { data: properties },
        { data: inquiries },
      ] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('properties').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('property_inquiries').select('created_at').gte('created_at', startDate.toISOString()),
      ]);

      // Group by date
      const dataByDate: Record<string, TrendDataPoint> = {};

      // Initialize all dates
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), 'MMM dd');
        dataByDate[date] = { date, users: 0, properties: 0, inquiries: 0 };
      }

      // Count by date
      (users || []).forEach(u => {
        const date = format(new Date(u.created_at), 'MMM dd');
        if (dataByDate[date]) dataByDate[date].users++;
      });

      (properties || []).forEach(p => {
        const date = format(new Date(p.created_at), 'MMM dd');
        if (dataByDate[date]) dataByDate[date].properties++;
      });

      (inquiries || []).forEach(i => {
        const date = format(new Date(i.created_at!), 'MMM dd');
        if (dataByDate[date]) dataByDate[date].inquiries++;
      });

      return Object.values(dataByDate);
    },
  });
}
