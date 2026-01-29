import { Settings } from 'lucide-react';
import { ChapterHeader, ChapterInsightCard } from '../shared';
import { useChapterInsights } from '@/hooks/useChapterInsights';
import { DataHealthCard } from '../DataHealthCard';
import { PerformanceMonitorTab } from '../PerformanceMonitorTab';
import { ExperimentResultsTab } from '../ExperimentResultsTab';
import { useConversionMetrics } from '@/hooks/useConversionMetrics';
import { useGeographicAnalytics } from '@/hooks/useGeographicAnalytics';
import { useViewsTrend } from '@/hooks/useAdminAnalytics';
import { ConversionFunnel } from '../../ConversionFunnel';
import { GeographicAnalytics } from '../../GeographicAnalytics';
import { ViewsTrendChart } from '../../ViewsTrendChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OperationsChapterProps {
  dateRange: number;
}

export function OperationsChapter({ dateRange }: OperationsChapterProps) {
  const { insights, signals, isLoading } = useChapterInsights('operations', dateRange);
  const { data: conversionData, isLoading: conversionLoading } = useConversionMetrics(dateRange);
  const { data: geoData, isLoading: geoLoading } = useGeographicAnalytics(dateRange);
  const { data: viewsTrend, isLoading: viewsLoading } = useViewsTrend(dateRange);

  return (
    <div className="space-y-6">
      <ChapterHeader
        icon={Settings}
        title="Operations"
        question="Is the platform healthy? What needs fixing?"
        description="This chapter monitors platform health—data quality, system performance, experiments, and tracking reliability. Use these insights to ensure your infrastructure is running smoothly and experiments are delivering results."
        signals={signals}
      />

      <ChapterInsightCard insights={insights} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background">
            Overview
          </TabsTrigger>
          <TabsTrigger value="data-health" className="rounded-lg data-[state=active]:bg-background">
            Data Quality
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-background">
            Performance
          </TabsTrigger>
          <TabsTrigger value="experiments" className="rounded-lg data-[state=active]:bg-background">
            Experiments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ConversionFunnel data={conversionData} isLoading={conversionLoading} />
            <GeographicAnalytics data={geoData} isLoading={geoLoading} />
          </div>
          <ViewsTrendChart data={viewsTrend} isLoading={viewsLoading} />
        </TabsContent>

        <TabsContent value="data-health">
          <DataHealthCard />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMonitorTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="experiments">
          <ExperimentResultsTab dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
