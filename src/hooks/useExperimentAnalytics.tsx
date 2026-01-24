import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExperimentMetrics {
  totalExperiments: number;
  totalExposures: number;
  totalConversions: number;
  overallConversionRate: number;
}

interface ExperimentData {
  experimentName: string;
  variants: VariantData[];
  totalExposures: number;
  startDate: string;
  isActive: boolean;
}

interface VariantData {
  variant: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
}

interface ConversionTrend {
  date: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
}

export function useExperimentAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['experiment-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: exposures, error } = await supabase
        .from('experiment_exposures')
        .select('*')
        .gte('exposed_at', startDate.toISOString());

      if (error) throw error;

      const data = exposures || [];
      const conversions = data.filter(e => e.converted).length;

      const metrics: ExperimentMetrics = {
        totalExperiments: new Set(data.map(e => e.experiment_name)).size,
        totalExposures: data.length,
        totalConversions: conversions,
        overallConversionRate: data.length > 0 ? (conversions / data.length) * 100 : 0,
      };

      // Experiment-specific data
      const experimentMap = new Map<string, { variants: Map<string, { exposures: number; conversions: number }>; startDate: string }>();
      
      data.forEach(e => {
        if (!experimentMap.has(e.experiment_name)) {
          experimentMap.set(e.experiment_name, { variants: new Map(), startDate: e.exposed_at });
        }
        
        const experiment = experimentMap.get(e.experiment_name)!;
        
        if (!experiment.variants.has(e.variant)) {
          experiment.variants.set(e.variant, { exposures: 0, conversions: 0 });
        }
        
        const variant = experiment.variants.get(e.variant)!;
        variant.exposures++;
        if (e.converted) variant.conversions++;
        
        if (new Date(e.exposed_at) < new Date(experiment.startDate)) {
          experiment.startDate = e.exposed_at;
        }
      });

      const experiments: ExperimentData[] = Array.from(experimentMap.entries())
        .map(([experimentName, expData]) => {
          const variants: VariantData[] = Array.from(expData.variants.entries())
            .map(([variant, varData]) => ({
              variant,
              exposures: varData.exposures,
              conversions: varData.conversions,
              conversionRate: varData.exposures > 0 ? (varData.conversions / varData.exposures) * 100 : 0,
            }));

          const totalExposures = variants.reduce((sum, v) => sum + v.exposures, 0);
          
          // Consider experiment active if it has exposures in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const recentExposures = data.filter(e => 
            e.experiment_name === experimentName && 
            new Date(e.exposed_at) > sevenDaysAgo
          );

          return {
            experimentName,
            variants,
            totalExposures,
            startDate: expData.startDate,
            isActive: recentExposures.length > 0,
          };
        })
        .sort((a, b) => b.totalExposures - a.totalExposures);

      // Conversion trend over time
      const dailyData = new Map<string, { exposures: number; conversions: number }>();
      data.forEach(e => {
        const date = new Date(e.exposed_at).toISOString().split('T')[0];
        const existing = dailyData.get(date) || { exposures: 0, conversions: 0 };
        existing.exposures++;
        if (e.converted) existing.conversions++;
        dailyData.set(date, existing);
      });

      const conversionTrend: ConversionTrend[] = Array.from(dailyData.entries())
        .map(([date, d]) => ({
          date,
          exposures: d.exposures,
          conversions: d.conversions,
          conversionRate: d.exposures > 0 ? (d.conversions / d.exposures) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        metrics,
        experiments,
        conversionTrend,
      };
    },
    staleTime: 60000,
  });
}
