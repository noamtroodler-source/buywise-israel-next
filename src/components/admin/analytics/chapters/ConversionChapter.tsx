import { Target } from 'lucide-react';
import { ChapterHeader, ChapterInsightCard } from '../shared';
import { useChapterInsights } from '@/hooks/useChapterInsights';
import { FunnelHealthTab } from '../FunnelHealthTab';
import { LeadQualityTab } from '../LeadQualityTab';
import { BuyerInsightsTab } from '../BuyerInsightsTab';
import { useInquiryMetrics } from '@/hooks/useInquiryMetrics';
import { InquiryPipeline } from '../../InquiryPipeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConversionChapterProps {
  dateRange: number;
}

export function ConversionChapter({ dateRange }: ConversionChapterProps) {
  const { insights, signals, isLoading } = useChapterInsights('conversion', dateRange);
  const { data: inquiryData, isLoading: inquiryLoading } = useInquiryMetrics(dateRange);

  return (
    <div className="space-y-6">
      <ChapterHeader
        icon={Target}
        title="Conversion"
        question="Are users taking action? What drives them forward?"
        description="This chapter tracks the journey from awareness to action—funnel progression, inquiry volume, lead quality, and buyer profiles. Use these insights to optimize conversion paths and identify friction points."
        signals={signals}
      />

      <ChapterInsightCard insights={insights} />

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="funnel" className="rounded-lg data-[state=active]:bg-background">
            Journey Funnel
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="rounded-lg data-[state=active]:bg-background">
            Inquiry Pipeline
          </TabsTrigger>
          <TabsTrigger value="leads" className="rounded-lg data-[state=active]:bg-background">
            Lead Quality
          </TabsTrigger>
          <TabsTrigger value="buyers" className="rounded-lg data-[state=active]:bg-background">
            Buyer Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funnel">
          <FunnelHealthTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="inquiries">
          <InquiryPipeline data={inquiryData} isLoading={inquiryLoading} />
        </TabsContent>

        <TabsContent value="leads">
          <LeadQualityTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="buyers">
          <BuyerInsightsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
