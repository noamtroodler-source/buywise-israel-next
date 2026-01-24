import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeadQualityMetrics {
  totalResponses: number;
  avgResponseTimeMinutes: number;
  visitScheduledCount: number;
  closedWonCount: number;
  closedLostCount: number;
  conversionRate: number;
}

interface ResponseTimeDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface OutcomeBreakdown {
  outcome: string;
  count: number;
  percentage: number;
}

interface LossReasonAnalysis {
  reason: string;
  count: number;
  percentage: number;
}

interface AgentPerformance {
  agentId: string;
  totalResponses: number;
  avgResponseTimeMinutes: number;
  conversionRate: number;
}

export function useLeadQualityAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['lead-quality-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: responses, error } = await supabase
        .from('lead_response_events')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const data = responses || [];
      
      const responseTimes = data.filter(r => r.first_response_time_minutes !== null).map(r => r.first_response_time_minutes);
      const closedWon = data.filter(r => r.outcome === 'closed_won').length;
      const closedLost = data.filter(r => r.outcome === 'closed_lost').length;

      const metrics: LeadQualityMetrics = {
        totalResponses: data.length,
        avgResponseTimeMinutes: responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0,
        visitScheduledCount: data.filter(r => r.outcome === 'visit_scheduled').length,
        closedWonCount: closedWon,
        closedLostCount: closedLost,
        conversionRate: data.length > 0 ? (closedWon / data.length) * 100 : 0,
      };

      // Response time distribution
      const timeRanges = [
        { range: '< 1 hour', min: 0, max: 60 },
        { range: '1-4 hours', min: 60, max: 240 },
        { range: '4-24 hours', min: 240, max: 1440 },
        { range: '> 24 hours', min: 1440, max: Infinity },
      ];

      const responseTimeDistribution: ResponseTimeDistribution[] = timeRanges.map(({ range, min, max }) => {
        const count = data.filter(r => 
          r.first_response_time_minutes !== null &&
          r.first_response_time_minutes >= min &&
          r.first_response_time_minutes < max
        ).length;
        
        return {
          range,
          count,
          percentage: data.length > 0 ? (count / data.length) * 100 : 0,
        };
      });

      // Outcome breakdown
      const outcomes = ['visit_scheduled', 'info_provided', 'closed_won', 'closed_lost', 'no_response'];
      const outcomeBreakdown: OutcomeBreakdown[] = outcomes.map(outcome => {
        const count = data.filter(r => r.outcome === outcome).length;
        return {
          outcome,
          count,
          percentage: data.length > 0 ? (count / data.length) * 100 : 0,
        };
      }).filter(o => o.count > 0);

      // Loss reason analysis
      const lostLeads = data.filter(r => r.outcome === 'closed_lost' && r.loss_reason);
      const lossReasons = ['price', 'location', 'timing', 'competition', 'unqualified', 'other'];
      const lossReasonAnalysis: LossReasonAnalysis[] = lossReasons.map(reason => {
        const count = lostLeads.filter(r => r.loss_reason === reason).length;
        return {
          reason,
          count,
          percentage: lostLeads.length > 0 ? (count / lostLeads.length) * 100 : 0,
        };
      }).filter(l => l.count > 0);

      // Agent performance (top 10)
      const agentData = new Map<string, { responses: number; totalTime: number; conversions: number }>();
      data.forEach(r => {
        if (r.agent_id) {
          const existing = agentData.get(r.agent_id) || { responses: 0, totalTime: 0, conversions: 0 };
          existing.responses++;
          if (r.first_response_time_minutes) existing.totalTime += r.first_response_time_minutes;
          if (r.outcome === 'closed_won') existing.conversions++;
          agentData.set(r.agent_id, existing);
        }
      });

      const agentPerformance: AgentPerformance[] = Array.from(agentData.entries())
        .map(([agentId, d]) => ({
          agentId,
          totalResponses: d.responses,
          avgResponseTimeMinutes: d.responses > 0 ? d.totalTime / d.responses : 0,
          conversionRate: d.responses > 0 ? (d.conversions / d.responses) * 100 : 0,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10);

      return {
        metrics,
        responseTimeDistribution,
        outcomeBreakdown,
        lossReasonAnalysis,
        agentPerformance,
      };
    },
    staleTime: 60000,
  });
}
