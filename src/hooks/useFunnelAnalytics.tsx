import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FunnelMetrics {
  totalMilestones: number;
  uniqueUsers: number;
  uniqueSessions: number;
}

interface MilestoneProgress {
  milestone: string;
  reached: number;
  percentage: number;
}

interface MilestoneDropoff {
  from: string;
  to: string;
  dropoffRate: number;
}

interface MilestoneTrend {
  date: string;
  milestones: Record<string, number>;
}

export function useFunnelAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['funnel-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: milestones, error } = await supabase
        .from('user_milestones')
        .select('*')
        .gte('first_reached_at', startDate.toISOString());

      if (error) throw error;

      const data = milestones || [];
      const uniqueUsers = new Set(data.filter(m => m.user_id).map(m => m.user_id)).size;
      const uniqueSessions = new Set(data.map(m => m.session_id)).size;

      const metrics: FunnelMetrics = {
        totalMilestones: data.length,
        uniqueUsers,
        uniqueSessions,
      };

      // Milestone progression (ordered funnel)
      const orderedMilestones = [
        'used_filters',
        'viewed_listing',
        'saved_listing',
        'ran_tool',
        'started_inquiry',
        'completed_inquiry',
        'created_account',
        'returned_7d',
        'returned_30d',
      ];

      const milestoneCounts = new Map<string, number>();
      data.forEach(m => {
        milestoneCounts.set(m.milestone, (milestoneCounts.get(m.milestone) || 0) + 1);
      });

      const totalBaseline = Math.max(...Array.from(milestoneCounts.values()), 1);
      
      const milestoneProgress: MilestoneProgress[] = orderedMilestones.map(milestone => {
        const reached = milestoneCounts.get(milestone) || 0;
        return {
          milestone,
          reached,
          percentage: totalBaseline > 0 ? (reached / totalBaseline) * 100 : 0,
        };
      });

      // Calculate dropoff between consecutive milestones
      const milestoneDropoff: MilestoneDropoff[] = [];
      for (let i = 0; i < orderedMilestones.length - 1; i++) {
        const from = orderedMilestones[i];
        const to = orderedMilestones[i + 1];
        const fromCount = milestoneCounts.get(from) || 0;
        const toCount = milestoneCounts.get(to) || 0;
        
        if (fromCount > 0) {
          milestoneDropoff.push({
            from,
            to,
            dropoffRate: ((fromCount - toCount) / fromCount) * 100,
          });
        }
      }

      // Milestone trend over time
      const dailyData = new Map<string, Record<string, number>>();
      data.forEach(m => {
        const date = new Date(m.first_reached_at).toISOString().split('T')[0];
        const existing = dailyData.get(date) || {};
        existing[m.milestone] = (existing[m.milestone] || 0) + 1;
        dailyData.set(date, existing);
      });

      const milestoneTrend: MilestoneTrend[] = Array.from(dailyData.entries())
        .map(([date, milestones]) => ({
          date,
          milestones,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        metrics,
        milestoneProgress,
        milestoneDropoff,
        milestoneTrend,
      };
    },
    staleTime: 60000,
  });
}
