import { Package } from 'lucide-react';
import { ChapterHeader, ChapterInsightCard } from '../shared';
import { useChapterInsights } from '@/hooks/useChapterInsights';
import { ListingIntelligenceTab } from '../ListingIntelligenceTab';
import { AdvertiserAnalyticsTab } from '../AdvertiserAnalyticsTab';
import { PriceIntelligenceTab } from '../PriceIntelligenceTab';
import { useInventoryHealth } from '@/hooks/useInventoryHealth';
import { useAgentPerformance } from '@/hooks/useAgentPerformance';
import { useGrowthMetrics, useCumulativeGrowth } from '@/hooks/useGrowthMetrics';
import { usePriceAnalytics } from '@/hooks/usePriceAnalytics';
import { InventoryHealthCard } from '../../InventoryHealthCard';
import { AgentLeaderboard } from '../../AgentLeaderboard';
import { GrowthMetrics } from '../../GrowthMetrics';
import { PriceAnalytics } from '../../PriceAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SupplyChapterProps {
  dateRange: number;
}

export function SupplyChapter({ dateRange }: SupplyChapterProps) {
  const { insights, signals, isLoading } = useChapterInsights('supply', dateRange);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryHealth();
  const { data: agentData, isLoading: agentLoading } = useAgentPerformance(dateRange);
  const { data: growthData, isLoading: growthLoading } = useGrowthMetrics(dateRange === 7 ? 7 : dateRange === 30 ? 30 : 30);
  const { data: trendData, isLoading: trendLoading } = useCumulativeGrowth(dateRange);
  const { data: priceData, isLoading: priceLoading } = usePriceAnalytics();

  return (
    <div className="space-y-6">
      <ChapterHeader
        icon={Package}
        title="Supply"
        question="What's the state of inventory? How is supply performing?"
        description="This chapter monitors your listing inventory—health metrics, lifecycle patterns, pricing trends, and advertiser performance. Use these insights to maintain fresh inventory and support your agents and developers."
        signals={signals}
      />

      <ChapterInsightCard insights={insights} />

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-background">
            Inventory Health
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="rounded-lg data-[state=active]:bg-background">
            Listing Intelligence
          </TabsTrigger>
          <TabsTrigger value="agents" className="rounded-lg data-[state=active]:bg-background">
            Agent Performance
          </TabsTrigger>
          <TabsTrigger value="advertisers" className="rounded-lg data-[state=active]:bg-background">
            Advertisers
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg data-[state=active]:bg-background">
            Price Intelligence
          </TabsTrigger>
          <TabsTrigger value="market" className="rounded-lg data-[state=active]:bg-background">
            Market Trends
          </TabsTrigger>
          <TabsTrigger value="growth" className="rounded-lg data-[state=active]:bg-background">
            Growth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <InventoryHealthCard data={inventoryData} isLoading={inventoryLoading} />
        </TabsContent>

        <TabsContent value="lifecycle">
          <ListingIntelligenceTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="agents">
          <AgentLeaderboard data={agentData} isLoading={agentLoading} limit={15} />
        </TabsContent>

        <TabsContent value="advertisers">
          <AdvertiserAnalyticsTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="pricing">
          <PriceIntelligenceTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="market">
          <PriceAnalytics data={priceData} isLoading={priceLoading} />
        </TabsContent>

        <TabsContent value="growth">
          <GrowthMetrics 
            data={growthData} 
            trendData={trendData}
            isLoading={growthLoading || trendLoading} 
            periodLabel={`Last ${dateRange} days vs previous`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
