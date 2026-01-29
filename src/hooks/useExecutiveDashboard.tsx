import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

export interface HealthMetric {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  status: 'green' | 'yellow' | 'red';
  trend: 'up' | 'down' | 'flat';
  category: 'engagement' | 'conversion' | 'content' | 'performance';
}

export interface JourneyStageData {
  stage: string;
  count: number;
  percentage: number;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: string;
}

// Determine status based on metric type and change
function getMetricStatus(
  metricType: string,
  changePercent: number,
  isHigherBetter: boolean = true
): 'green' | 'yellow' | 'red' {
  const threshold = 10; // 10% change threshold
  
  if (isHigherBetter) {
    if (changePercent >= threshold) return 'green';
    if (changePercent <= -threshold) return 'red';
    return 'yellow';
  } else {
    if (changePercent <= -threshold) return 'green';
    if (changePercent >= threshold) return 'red';
    return 'yellow';
  }
}

export function useExecutiveMetrics(days: number = 7) {
  return useQuery({
    queryKey: ['executive-metrics', days],
    queryFn: async (): Promise<HealthMetric[]> => {
      const now = new Date();
      const currentStart = startOfDay(subDays(now, days));
      const previousStart = startOfDay(subDays(now, days * 2));
      const previousEnd = startOfDay(subDays(now, days));

      // Fetch current and previous period data in parallel
      const [
        currentViews,
        previousViews,
        currentInquiries,
        previousInquiries,
        currentUsers,
        previousUsers,
        currentSearches,
        previousSearches,
        currentSaves,
        previousSaves,
        currentErrors,
        previousErrors,
      ] = await Promise.all([
        // Current period views
        supabase
          .from('property_views')
          .select('id', { count: 'exact', head: true })
          .gte('viewed_at', currentStart.toISOString()),
        // Previous period views
        supabase
          .from('property_views')
          .select('id', { count: 'exact', head: true })
          .gte('viewed_at', previousStart.toISOString())
          .lt('viewed_at', previousEnd.toISOString()),
        // Current inquiries
        supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        // Previous inquiries
        supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
        // Current new users
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        // Previous new users
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
        // Current searches
        supabase
          .from('search_analytics')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        // Previous searches
        supabase
          .from('search_analytics')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
        // Current saves
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        // Previous saves
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
        // Current errors
        supabase
          .from('client_errors')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', currentStart.toISOString()),
        // Previous errors
        supabase
          .from('client_errors')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', previousEnd.toISOString()),
      ]);

      const metrics: HealthMetric[] = [];

      // Helper to calculate change
      const calcChange = (current: number, previous: number) => {
        const change = current - previous;
        const changePercent = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0);
        return { change, changePercent };
      };

      // Property Views
      const viewsCurrent = currentViews.count || 0;
      const viewsPrevious = previousViews.count || 0;
      const viewsChange = calcChange(viewsCurrent, viewsPrevious);
      metrics.push({
        label: 'Property Views',
        current: viewsCurrent,
        previous: viewsPrevious,
        ...viewsChange,
        status: getMetricStatus('views', viewsChange.changePercent, true),
        trend: viewsChange.change > 0 ? 'up' : viewsChange.change < 0 ? 'down' : 'flat',
        category: 'engagement',
      });

      // Inquiries
      const inquiriesCurrent = currentInquiries.count || 0;
      const inquiriesPrevious = previousInquiries.count || 0;
      const inquiriesChange = calcChange(inquiriesCurrent, inquiriesPrevious);
      metrics.push({
        label: 'Inquiries',
        current: inquiriesCurrent,
        previous: inquiriesPrevious,
        ...inquiriesChange,
        status: getMetricStatus('inquiries', inquiriesChange.changePercent, true),
        trend: inquiriesChange.change > 0 ? 'up' : inquiriesChange.change < 0 ? 'down' : 'flat',
        category: 'conversion',
      });

      // New Users
      const usersCurrent = currentUsers.count || 0;
      const usersPrevious = previousUsers.count || 0;
      const usersChange = calcChange(usersCurrent, usersPrevious);
      metrics.push({
        label: 'New Users',
        current: usersCurrent,
        previous: usersPrevious,
        ...usersChange,
        status: getMetricStatus('users', usersChange.changePercent, true),
        trend: usersChange.change > 0 ? 'up' : usersChange.change < 0 ? 'down' : 'flat',
        category: 'engagement',
      });

      // Searches
      const searchesCurrent = currentSearches.count || 0;
      const searchesPrevious = previousSearches.count || 0;
      const searchesChange = calcChange(searchesCurrent, searchesPrevious);
      metrics.push({
        label: 'Searches',
        current: searchesCurrent,
        previous: searchesPrevious,
        ...searchesChange,
        status: getMetricStatus('searches', searchesChange.changePercent, true),
        trend: searchesChange.change > 0 ? 'up' : searchesChange.change < 0 ? 'down' : 'flat',
        category: 'engagement',
      });

      // Saves
      const savesCurrent = currentSaves.count || 0;
      const savesPrevious = previousSaves.count || 0;
      const savesChange = calcChange(savesCurrent, savesPrevious);
      metrics.push({
        label: 'Properties Saved',
        current: savesCurrent,
        previous: savesPrevious,
        ...savesChange,
        status: getMetricStatus('saves', savesChange.changePercent, true),
        trend: savesChange.change > 0 ? 'up' : savesChange.change < 0 ? 'down' : 'flat',
        category: 'conversion',
      });

      // Client Errors (lower is better)
      const errorsCurrent = currentErrors.count || 0;
      const errorsPrevious = previousErrors.count || 0;
      const errorsChange = calcChange(errorsCurrent, errorsPrevious);
      metrics.push({
        label: 'Client Errors',
        current: errorsCurrent,
        previous: errorsPrevious,
        ...errorsChange,
        status: getMetricStatus('errors', errorsChange.changePercent, false),
        trend: errorsChange.change > 0 ? 'up' : errorsChange.change < 0 ? 'down' : 'flat',
        category: 'performance',
      });

      return metrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useJourneyStages() {
  return useQuery({
    queryKey: ['journey-stages'],
    queryFn: async (): Promise<JourneyStageData[]> => {
      const { data, error } = await supabase
        .from('user_journeys')
        .select('journey_stage');

      if (error) throw error;

      const stageCounts: Record<string, number> = {
        awareness: 0,
        consideration: 0,
        decision: 0,
        action: 0,
        retention: 0,
      };

      data?.forEach((row) => {
        if (row.journey_stage && stageCounts.hasOwnProperty(row.journey_stage)) {
          stageCounts[row.journey_stage]++;
        }
      });

      const total = Object.values(stageCounts).reduce((a, b) => a + b, 0);

      return Object.entries(stageCounts).map(([stage, count]) => ({
        stage,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnomalyAlerts(days: number = 7) {
  return useQuery({
    queryKey: ['anomaly-alerts', days],
    queryFn: async (): Promise<AlertItem[]> => {
      const now = new Date();
      const periodStart = startOfDay(subDays(now, days));
      const alerts: AlertItem[] = [];

      // Check for zero-result search spikes
      const { count: zeroResultCount } = await supabase
        .from('search_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('results_count', 0)
        .gte('created_at', periodStart.toISOString());

      const { count: totalSearchCount } = await supabase
        .from('search_analytics')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString());

      const zeroResultRate = (totalSearchCount || 0) > 0 
        ? ((zeroResultCount || 0) / (totalSearchCount || 1)) * 100 
        : 0;

      if (zeroResultRate > 20) {
        alerts.push({
          id: 'zero-results-spike',
          type: zeroResultRate > 30 ? 'critical' : 'warning',
          title: 'High Zero-Result Rate',
          message: `${zeroResultRate.toFixed(1)}% of searches returned no results`,
          metric: 'Zero-Result Rate',
          threshold: 20,
          currentValue: zeroResultRate,
          timestamp: now.toISOString(),
        });
      }

      // Check for error spikes
      const { count: errorCount } = await supabase
        .from('client_errors')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString());

      if ((errorCount || 0) > 50) {
        alerts.push({
          id: 'error-spike',
          type: (errorCount || 0) > 100 ? 'critical' : 'warning',
          title: 'Elevated Error Rate',
          message: `${errorCount} client errors in the last ${days} days`,
          metric: 'Client Errors',
          threshold: 50,
          currentValue: errorCount || 0,
          timestamp: now.toISOString(),
        });
      }

      // Check for stale listings
      const { count: staleCount } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .lt('updated_at', subDays(now, 30).toISOString());
      if ((staleCount || 0) > 20) {
        alerts.push({
          id: 'stale-listings',
          type: 'warning',
          title: 'Stale Listings Detected',
          message: `${staleCount} listings haven't been updated in 30+ days`,
          metric: 'Stale Listings',
          threshold: 20,
          currentValue: staleCount || 0,
          timestamp: now.toISOString(),
        });
      }

      // If no alerts, add a positive info message
      if (alerts.length === 0) {
        alerts.push({
          id: 'all-clear',
          type: 'info',
          title: 'All Systems Normal',
          message: 'No anomalies detected in the current period',
          timestamp: now.toISOString(),
        });
      }

      return alerts;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePriceAlertEffectiveness(days: number = 30) {
  return useQuery({
    queryKey: ['price-alert-effectiveness', days],
    queryFn: async () => {
      const periodStart = startOfDay(subDays(new Date(), days));

      const { data, error } = await supabase
        .from('price_drop_notifications')
        .select('id, email_opened_at, link_clicked_at, resulted_in_inquiry, resulted_in_save')
        .gte('created_at', periodStart.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const opened = data?.filter(d => d.email_opened_at).length || 0;
      const clicked = data?.filter(d => d.link_clicked_at).length || 0;
      const inquiries = data?.filter(d => d.resulted_in_inquiry).length || 0;
      const saves = data?.filter(d => d.resulted_in_save).length || 0;

      return {
        total,
        opened,
        clicked,
        inquiries,
        saves,
        openRate: total > 0 ? (opened / total) * 100 : 0,
        clickRate: total > 0 ? (clicked / total) * 100 : 0,
        conversionRate: total > 0 ? ((inquiries + saves) / total) * 100 : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
