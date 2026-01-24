import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentMetrics {
  totalViews: number;
  avgCompletionPercent: number;
  avgActiveTimeMs: number;
  avgScrollDepth: number;
}

interface ContentTypePerformance {
  contentType: string;
  views: number;
  avgCompletionPercent: number;
  avgActiveTimeMs: number;
}

interface NextActionAttribution {
  action: string;
  count: number;
  percentage: number;
}

interface TopContent {
  contentId: string;
  contentType: string;
  views: number;
  avgCompletionPercent: number;
  engagementScore: number;
}

export function useContentAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['content-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: engagement, error } = await supabase
        .from('content_engagement')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const data = engagement || [];
      
      const completions = data.filter(e => e.completion_percent !== null).map(e => e.completion_percent);
      const activeTimes = data.filter(e => e.active_time_ms !== null).map(e => e.active_time_ms);
      const scrollDepths = data.filter(e => e.scroll_depth_max !== null).map(e => e.scroll_depth_max);

      const metrics: ContentMetrics = {
        totalViews: data.length,
        avgCompletionPercent: completions.length > 0 
          ? completions.reduce((a, b) => a + b, 0) / completions.length 
          : 0,
        avgActiveTimeMs: activeTimes.length > 0 
          ? activeTimes.reduce((a, b) => a + b, 0) / activeTimes.length 
          : 0,
        avgScrollDepth: scrollDepths.length > 0 
          ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length 
          : 0,
      };

      // Content type performance
      const contentTypes = ['blog_post', 'guide', 'glossary'];
      const contentTypePerformance: ContentTypePerformance[] = contentTypes.map(type => {
        const typeData = data.filter(e => e.content_type === type);
        const typeCompletions = typeData.filter(e => e.completion_percent !== null).map(e => e.completion_percent);
        const typeActiveTimes = typeData.filter(e => e.active_time_ms !== null).map(e => e.active_time_ms);

        return {
          contentType: type,
          views: typeData.length,
          avgCompletionPercent: typeCompletions.length > 0 
            ? typeCompletions.reduce((a, b) => a + b, 0) / typeCompletions.length 
            : 0,
          avgActiveTimeMs: typeActiveTimes.length > 0 
            ? typeActiveTimes.reduce((a, b) => a + b, 0) / typeActiveTimes.length 
            : 0,
        };
      }).filter(c => c.views > 0);

      // Next action attribution
      const nextActions = data.filter(e => e.next_action).map(e => e.next_action);
      const actionCounts = new Map<string, number>();
      nextActions.forEach(action => {
        actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
      });

      const nextActionAttribution: NextActionAttribution[] = Array.from(actionCounts.entries())
        .map(([action, count]) => ({
          action,
          count,
          percentage: nextActions.length > 0 ? (count / nextActions.length) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Top content pieces
      const contentData = new Map<string, { type: string; views: number; totalCompletion: number; totalTime: number }>();
      data.forEach(e => {
        if (e.content_id) {
          const existing = contentData.get(e.content_id) || { type: e.content_type, views: 0, totalCompletion: 0, totalTime: 0 };
          existing.views++;
          if (e.completion_percent) existing.totalCompletion += e.completion_percent;
          if (e.active_time_ms) existing.totalTime += e.active_time_ms;
          contentData.set(e.content_id, existing);
        }
      });

      const topContent: TopContent[] = Array.from(contentData.entries())
        .map(([contentId, d]) => {
          const avgCompletion = d.views > 0 ? d.totalCompletion / d.views : 0;
          const avgTime = d.views > 0 ? d.totalTime / d.views : 0;
          // Engagement score: weighted combination of views, completion, and time
          const engagementScore = (d.views * 0.3) + (avgCompletion * 0.4) + (avgTime / 60000 * 0.3);
          
          return {
            contentId,
            contentType: d.type,
            views: d.views,
            avgCompletionPercent: avgCompletion,
            engagementScore,
          };
        })
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10);

      return {
        metrics,
        contentTypePerformance,
        nextActionAttribution,
        topContent,
      };
    },
    staleTime: 60000,
  });
}
