import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EngagementMetrics {
  totalSessions: number;
  engagedSessions: number;
  engagementRate: number;
  avgActiveTime: number;
  avgScrollDepth: number;
  avgInteractions: number;
}

interface PageTypeEngagement {
  pageType: string;
  sessions: number;
  avgActiveTime: number;
  avgScrollDepth: number;
  engagementRate: number;
}

interface ScrollDepthDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface ExitTypeBreakdown {
  exitType: string;
  count: number;
  percentage: number;
}

interface EngagementTrend {
  date: string;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
}

export function useEngagementAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['engagement-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: engagement, error } = await supabase
        .from('page_engagement')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const data = engagement || [];
      const totalSessions = data.length;
      const engagedSessions = data.filter(e => e.engaged).length;
      
      const activeTimes = data.filter(e => e.active_time_ms).map(e => e.active_time_ms);
      const scrollDepths = data.filter(e => e.scroll_depth_max !== null).map(e => e.scroll_depth_max);
      const interactions = data.filter(e => e.interactions_count !== null).map(e => e.interactions_count);

      const metrics: EngagementMetrics = {
        totalSessions,
        engagedSessions,
        engagementRate: totalSessions > 0 ? (engagedSessions / totalSessions) * 100 : 0,
        avgActiveTime: activeTimes.length > 0 ? activeTimes.reduce((a, b) => a + b, 0) / activeTimes.length : 0,
        avgScrollDepth: scrollDepths.length > 0 ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length : 0,
        avgInteractions: interactions.length > 0 ? interactions.reduce((a, b) => a + b, 0) / interactions.length : 0,
      };

      // Page type engagement
      const pageTypes = ['property', 'project', 'blog', 'tool', 'search', 'home'];
      const pageTypeEngagement: PageTypeEngagement[] = pageTypes.map(type => {
        const typeData = data.filter(e => e.entity_type === type || e.page_path?.includes(type));
        const typeEngaged = typeData.filter(e => e.engaged).length;
        const typeActiveTimes = typeData.filter(e => e.active_time_ms).map(e => e.active_time_ms);
        const typeScrollDepths = typeData.filter(e => e.scroll_depth_max !== null).map(e => e.scroll_depth_max);
        
        return {
          pageType: type,
          sessions: typeData.length,
          avgActiveTime: typeActiveTimes.length > 0 ? typeActiveTimes.reduce((a, b) => a + b, 0) / typeActiveTimes.length : 0,
          avgScrollDepth: typeScrollDepths.length > 0 ? typeScrollDepths.reduce((a, b) => a + b, 0) / typeScrollDepths.length : 0,
          engagementRate: typeData.length > 0 ? (typeEngaged / typeData.length) * 100 : 0,
        };
      }).filter(p => p.sessions > 0);

      // Scroll depth distribution
      const scrollRanges = [
        { range: '0-25%', min: 0, max: 25 },
        { range: '25-50%', min: 25, max: 50 },
        { range: '50-75%', min: 50, max: 75 },
        { range: '75-100%', min: 75, max: 100 },
      ];
      
      const scrollDepthDistribution: ScrollDepthDistribution[] = scrollRanges.map(({ range, min, max }) => {
        const count = data.filter(e => 
          e.scroll_depth_max !== null && 
          e.scroll_depth_max >= min && 
          e.scroll_depth_max < (max === 100 ? 101 : max)
        ).length;
        
        return {
          range,
          count,
          percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
        };
      });

      // Exit type breakdown
      const exitTypes = ['back', 'navigate', 'close', 'external'];
      const exitTypeBreakdown: ExitTypeBreakdown[] = exitTypes.map(type => {
        const count = data.filter(e => e.exit_type === type).length;
        return {
          exitType: type,
          count,
          percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
        };
      });

      // Engagement trend over time
      const dailyData = new Map<string, { sessions: number; engaged: number }>();
      data.forEach(e => {
        const date = new Date(e.created_at).toISOString().split('T')[0];
        const existing = dailyData.get(date) || { sessions: 0, engaged: 0 };
        existing.sessions++;
        if (e.engaged) existing.engaged++;
        dailyData.set(date, existing);
      });

      const engagementTrend: EngagementTrend[] = Array.from(dailyData.entries())
        .map(([date, d]) => ({
          date,
          sessions: d.sessions,
          engagedSessions: d.engaged,
          engagementRate: d.sessions > 0 ? (d.engaged / d.sessions) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        metrics,
        pageTypeEngagement,
        scrollDepthDistribution,
        exitTypeBreakdown,
        engagementTrend,
      };
    },
    staleTime: 60000,
  });
}
