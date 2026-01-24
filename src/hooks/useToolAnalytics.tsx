import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ToolMetrics {
  totalRuns: number;
  completedRuns: number;
  abandonedRuns: number;
  completionRate: number;
  avgDurationMs: number;
}

interface ToolPerformance {
  toolName: string;
  runs: number;
  completed: number;
  abandoned: number;
  completionRate: number;
  avgDurationMs: number;
}

interface StepAbandonment {
  stepName: string;
  entered: number;
  exited: number;
  abandoned: number;
  abandonmentRate: number;
}

interface NextActionDistribution {
  action: string;
  count: number;
  percentage: number;
}

interface ToolUsageTrend {
  date: string;
  runs: number;
  completions: number;
  completionRate: number;
}

export function useToolAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['tool-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const [toolRunsRes, stepEventsRes] = await Promise.all([
        supabase
          .from('tool_runs')
          .select('*')
          .gte('started_at', startDate.toISOString()),
        supabase
          .from('tool_step_events')
          .select('*')
          .gte('entered_at', startDate.toISOString()),
      ]);

      if (toolRunsRes.error) throw toolRunsRes.error;
      if (stepEventsRes.error) throw stepEventsRes.error;

      const toolRuns = toolRunsRes.data || [];
      const stepEvents = stepEventsRes.data || [];

      // Overall metrics
      const completedRuns = toolRuns.filter(r => r.completion_status === 'completed').length;
      const abandonedRuns = toolRuns.filter(r => r.completion_status === 'abandoned').length;
      
      const durations = toolRuns
        .filter(r => r.started_at && r.completed_at)
        .map(r => new Date(r.completed_at).getTime() - new Date(r.started_at).getTime());

      const metrics: ToolMetrics = {
        totalRuns: toolRuns.length,
        completedRuns,
        abandonedRuns,
        completionRate: toolRuns.length > 0 ? (completedRuns / toolRuns.length) * 100 : 0,
        avgDurationMs: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      };

      // Tool-specific performance
      const toolNames = [...new Set(toolRuns.map(r => r.tool_name))];
      const toolPerformance: ToolPerformance[] = toolNames.map(name => {
        const toolData = toolRuns.filter(r => r.tool_name === name);
        const completed = toolData.filter(r => r.completion_status === 'completed').length;
        const abandoned = toolData.filter(r => r.completion_status === 'abandoned').length;
        const toolDurations = toolData
          .filter(r => r.started_at && r.completed_at)
          .map(r => new Date(r.completed_at).getTime() - new Date(r.started_at).getTime());

        return {
          toolName: name,
          runs: toolData.length,
          completed,
          abandoned,
          completionRate: toolData.length > 0 ? (completed / toolData.length) * 100 : 0,
          avgDurationMs: toolDurations.length > 0 ? toolDurations.reduce((a, b) => a + b, 0) / toolDurations.length : 0,
        };
      }).sort((a, b) => b.runs - a.runs);

      // Step abandonment analysis
      const stepNames = [...new Set(stepEvents.map(e => e.step_name))];
      const stepAbandonment: StepAbandonment[] = stepNames.map(name => {
        const stepData = stepEvents.filter(e => e.step_name === name);
        const entered = stepData.length;
        const exited = stepData.filter(e => e.exited_at).length;
        const abandoned = stepData.filter(e => e.abandoned).length;

        return {
          stepName: name,
          entered,
          exited,
          abandoned,
          abandonmentRate: entered > 0 ? (abandoned / entered) * 100 : 0,
        };
      }).sort((a, b) => a.stepName.localeCompare(b.stepName));

      // Next action distribution
      const nextActions = toolRuns.filter(r => r.next_action).map(r => r.next_action);
      const actionCounts = new Map<string, number>();
      nextActions.forEach(action => {
        actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
      });

      const nextActionDistribution: NextActionDistribution[] = Array.from(actionCounts.entries())
        .map(([action, count]) => ({
          action,
          count,
          percentage: nextActions.length > 0 ? (count / nextActions.length) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Usage trend over time
      const dailyData = new Map<string, { runs: number; completions: number }>();
      toolRuns.forEach(run => {
        const date = new Date(run.started_at).toISOString().split('T')[0];
        const existing = dailyData.get(date) || { runs: 0, completions: 0 };
        existing.runs++;
        if (run.completion_status === 'completed') existing.completions++;
        dailyData.set(date, existing);
      });

      const usageTrend: ToolUsageTrend[] = Array.from(dailyData.entries())
        .map(([date, d]) => ({
          date,
          runs: d.runs,
          completions: d.completions,
          completionRate: d.runs > 0 ? (d.completions / d.runs) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        metrics,
        toolPerformance,
        stepAbandonment,
        nextActionDistribution,
        usageTrend,
      };
    },
    staleTime: 60000,
  });
}
