import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  avgLCP: number;
  avgCLS: number;
  avgINP: number;
  avgRouteLoadTime: number;
  lcpRating: 'good' | 'needs-improvement' | 'poor';
  clsRating: 'good' | 'needs-improvement' | 'poor';
  inpRating: 'good' | 'needs-improvement' | 'poor';
}

interface ErrorMetrics {
  totalErrors: number;
  jsErrors: number;
  mapFailures: number;
  searchFailures: number;
  apiErrors: number;
}

interface SlowestRoutes {
  pagePath: string;
  avgLoadTime: number;
  samples: number;
}

interface IntegrationHealth {
  integrationType: string;
  successRate: number;
  avgResponseTime: number;
  samples: number;
}

interface ErrorTrend {
  date: string;
  errors: number;
  byType: Record<string, number>;
}

export function usePerformanceAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['performance-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const [metricsRes, errorsRes, integrationRes] = await Promise.all([
        supabase
          .from('performance_metrics')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('client_errors')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('integration_health')
          .select('*')
          .gte('created_at', startDate.toISOString()),
      ]);

      if (metricsRes.error) throw metricsRes.error;
      if (errorsRes.error) throw errorsRes.error;
      if (integrationRes.error) throw integrationRes.error;

      const perfData = metricsRes.data || [];
      const errorData = errorsRes.data || [];
      const integrationData = integrationRes.data || [];

      // Core Web Vitals
      const lcpValues = perfData.filter(p => p.lcp_ms).map(p => p.lcp_ms);
      const clsValues = perfData.filter(p => p.cls !== null).map(p => p.cls);
      const inpValues = perfData.filter(p => p.inp_ms).map(p => p.inp_ms);
      const loadTimes = perfData.filter(p => p.route_load_time_ms).map(p => p.route_load_time_ms);

      const avgLCP = lcpValues.length > 0 ? lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length : 0;
      const avgCLS = clsValues.length > 0 ? clsValues.reduce((a, b) => a + b, 0) / clsValues.length : 0;
      const avgINP = inpValues.length > 0 ? inpValues.reduce((a, b) => a + b, 0) / inpValues.length : 0;
      const avgRouteLoadTime = loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;

      // Rating thresholds based on Google's Core Web Vitals
      const getLCPRating = (lcp: number): 'good' | 'needs-improvement' | 'poor' => {
        if (lcp <= 2500) return 'good';
        if (lcp <= 4000) return 'needs-improvement';
        return 'poor';
      };

      const getCLSRating = (cls: number): 'good' | 'needs-improvement' | 'poor' => {
        if (cls <= 0.1) return 'good';
        if (cls <= 0.25) return 'needs-improvement';
        return 'poor';
      };

      const getINPRating = (inp: number): 'good' | 'needs-improvement' | 'poor' => {
        if (inp <= 200) return 'good';
        if (inp <= 500) return 'needs-improvement';
        return 'poor';
      };

      const performanceMetrics: PerformanceMetrics = {
        avgLCP,
        avgCLS,
        avgINP,
        avgRouteLoadTime,
        lcpRating: getLCPRating(avgLCP),
        clsRating: getCLSRating(avgCLS),
        inpRating: getINPRating(avgINP),
      };

      // Error metrics
      const errorMetrics: ErrorMetrics = {
        totalErrors: errorData.length,
        jsErrors: errorData.filter(e => e.error_type === 'js_error').length,
        mapFailures: errorData.filter(e => e.error_type === 'map_failure').length,
        searchFailures: errorData.filter(e => e.error_type === 'search_failure').length,
        apiErrors: errorData.filter(e => e.error_type === 'api_error').length,
      };

      // Slowest routes
      const routeData = new Map<string, { totalTime: number; count: number }>();
      perfData.forEach(p => {
        if (p.page_path && p.route_load_time_ms) {
          const existing = routeData.get(p.page_path) || { totalTime: 0, count: 0 };
          existing.totalTime += p.route_load_time_ms;
          existing.count++;
          routeData.set(p.page_path, existing);
        }
      });

      const slowestRoutes: SlowestRoutes[] = Array.from(routeData.entries())
        .map(([pagePath, data]) => ({
          pagePath,
          avgLoadTime: data.count > 0 ? data.totalTime / data.count : 0,
          samples: data.count,
        }))
        .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
        .slice(0, 10);

      // Integration health
      const integrationStats = new Map<string, { success: number; total: number; totalTime: number }>();
      integrationData.forEach(i => {
        const existing = integrationStats.get(i.integration_type) || { success: 0, total: 0, totalTime: 0 };
        existing.total++;
        if (i.success) existing.success++;
        if (i.response_time_ms) existing.totalTime += i.response_time_ms;
        integrationStats.set(i.integration_type, existing);
      });

      const integrationHealth: IntegrationHealth[] = Array.from(integrationStats.entries())
        .map(([integrationType, data]) => ({
          integrationType,
          successRate: data.total > 0 ? (data.success / data.total) * 100 : 0,
          avgResponseTime: data.total > 0 ? data.totalTime / data.total : 0,
          samples: data.total,
        }));

      // Error trend over time
      const dailyErrors = new Map<string, { total: number; byType: Record<string, number> }>();
      errorData.forEach(e => {
        const date = new Date(e.created_at).toISOString().split('T')[0];
        const existing = dailyErrors.get(date) || { total: 0, byType: {} };
        existing.total++;
        existing.byType[e.error_type] = (existing.byType[e.error_type] || 0) + 1;
        dailyErrors.set(date, existing);
      });

      const errorTrend: ErrorTrend[] = Array.from(dailyErrors.entries())
        .map(([date, data]) => ({
          date,
          errors: data.total,
          byType: data.byType,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        performanceMetrics,
        errorMetrics,
        slowestRoutes,
        integrationHealth,
        errorTrend,
      };
    },
    staleTime: 60000,
  });
}
