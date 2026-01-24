import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ImpressionMetrics {
  totalImpressions: number;
  totalClicks: number;
  overallCTR: number;
  avgTimeVisible: number;
  promotedImpressions: number;
  organicImpressions: number;
  promotedCTR: number;
  organicCTR: number;
}

interface PositionPerformance {
  positionRange: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface FilterPerformance {
  filterHash: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface EntityTypeBreakdown {
  entityType: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export function useImpressionAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['impression-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: impressions, error } = await supabase
        .from('listing_impressions')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculate metrics - use viewport_visible as proxy for engagement
      const totalImpressions = impressions?.length || 0;
      const viewedImpressions = impressions?.filter(i => i.viewport_visible) || [];
      const totalClicks = viewedImpressions.length;
      const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      
      const visibleTimes = impressions?.filter(i => i.time_visible_ms).map(i => i.time_visible_ms) || [];
      const avgTimeVisible = visibleTimes.length > 0 
        ? visibleTimes.reduce((a, b) => (a || 0) + (b || 0), 0) / visibleTimes.length 
        : 0;

      const promotedImpressions = impressions?.filter(i => i.was_promoted) || [];
      const organicImpressions = impressions?.filter(i => !i.was_promoted) || [];
      
      const promotedClicks = promotedImpressions.filter(i => i.viewport_visible).length;
      const organicClicks = organicImpressions.filter(i => i.viewport_visible).length;

      const metrics: ImpressionMetrics = {
        totalImpressions,
        totalClicks,
        overallCTR,
        avgTimeVisible,
        promotedImpressions: promotedImpressions.length,
        organicImpressions: organicImpressions.length,
        promotedCTR: promotedImpressions.length > 0 ? (promotedClicks / promotedImpressions.length) * 100 : 0,
        organicCTR: organicImpressions.length > 0 ? (organicClicks / organicImpressions.length) * 100 : 0,
      };

      // Position performance
      const positionRanges = ['1-5', '6-10', '11-20', '21-50', '50+'];
      const positionPerformance: PositionPerformance[] = positionRanges.map(range => {
        const [min, max] = range === '50+' 
          ? [51, Infinity] 
          : range.split('-').map(Number);
        
        const rangeImpressions = impressions?.filter(i => 
          i.position_in_results >= min && i.position_in_results <= (max || Infinity)
        ) || [];
        
        const rangeClicks = rangeImpressions.filter(i => i.viewport_visible).length;
        
        return {
          positionRange: range,
          impressions: rangeImpressions.length,
          clicks: rangeClicks,
          ctr: rangeImpressions.length > 0 ? (rangeClicks / rangeImpressions.length) * 100 : 0,
        };
      });

      // Filter hash performance (top 10)
      const filterHashCounts = new Map<string, { impressions: number; clicks: number }>();
      impressions?.forEach(i => {
        if (i.filter_hash) {
          const existing = filterHashCounts.get(i.filter_hash) || { impressions: 0, clicks: 0 };
          existing.impressions++;
          if (i.viewport_visible) existing.clicks++;
          filterHashCounts.set(i.filter_hash, existing);
        }
      });

      const filterPerformance: FilterPerformance[] = Array.from(filterHashCounts.entries())
        .map(([hash, data]) => ({
          filterHash: hash,
          impressions: data.impressions,
          clicks: data.clicks,
          ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);

      // Entity type breakdown
      const entityTypes = ['property', 'project'];
      const entityTypeBreakdown: EntityTypeBreakdown[] = entityTypes.map(type => {
        const typeImpressions = impressions?.filter(i => i.entity_type === type) || [];
        const typeClicks = typeImpressions.filter(i => i.viewport_visible).length;
        
        return {
          entityType: type,
          impressions: typeImpressions.length,
          clicks: typeClicks,
          ctr: typeImpressions.length > 0 ? (typeClicks / typeImpressions.length) * 100 : 0,
        };
      });

      return {
        metrics,
        positionPerformance,
        filterPerformance,
        entityTypeBreakdown,
      };
    },
    staleTime: 60000,
  });
}
