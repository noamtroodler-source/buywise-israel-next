import { MapPin } from 'lucide-react';
import { ChapterHeader, ChapterInsightCard } from '../shared';
import { useChapterInsights } from '@/hooks/useChapterInsights';
import { SearchIntelligenceTab } from '../SearchIntelligenceTab';
import { CityAnalyticsTab } from '../CityAnalyticsTab';
import { ImpressionsTab } from '../ImpressionsTab';
import { LocationModuleTab } from '../LocationModuleTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiscoveryChapterProps {
  dateRange: number;
}

export function DiscoveryChapter({ dateRange }: DiscoveryChapterProps) {
  const { insights, signals, isLoading } = useChapterInsights('discovery', dateRange);

  return (
    <div className="space-y-6">
      <ChapterHeader
        icon={MapPin}
        title="Discovery"
        question="Where is the demand? How are people finding properties?"
        description="This chapter shows demand signals from search behavior, geographic interest, and visibility in search results. Use these insights to understand what buyers are looking for and where supply gaps exist."
        signals={signals}
      />

      <ChapterInsightCard insights={insights} />

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="search" className="rounded-lg data-[state=active]:bg-background">
            Search Intelligence
          </TabsTrigger>
          <TabsTrigger value="cities" className="rounded-lg data-[state=active]:bg-background">
            City Analytics
          </TabsTrigger>
          <TabsTrigger value="impressions" className="rounded-lg data-[state=active]:bg-background">
            Impressions
          </TabsTrigger>
          <TabsTrigger value="location" className="rounded-lg data-[state=active]:bg-background">
            Location Module
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <SearchIntelligenceTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="cities">
          <CityAnalyticsTab days={dateRange} />
        </TabsContent>

        <TabsContent value="impressions">
          <ImpressionsTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="location">
          <LocationModuleTab dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
