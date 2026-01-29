import { Activity } from 'lucide-react';
import { ChapterHeader, ChapterInsightCard } from '../shared';
import { useChapterInsights } from '@/hooks/useChapterInsights';
import { UserBehaviorTab } from '../UserBehaviorTab';
import { EngagementDepthTab } from '../EngagementDepthTab';
import { ToolPerformanceTab } from '../ToolPerformanceTab';
import { ContentPerformanceTab } from '../ContentPerformanceTab';
import { ShareAnalyticsTab } from '../ShareAnalyticsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EngagementChapterProps {
  dateRange: number;
}

export function EngagementChapter({ dateRange }: EngagementChapterProps) {
  const { insights, signals, isLoading } = useChapterInsights('engagement', dateRange);

  return (
    <div className="space-y-6">
      <ChapterHeader
        icon={Activity}
        title="Engagement"
        question="What are users doing once they arrive? How deep do they go?"
        description="This chapter reveals how users interact with your platform—session quality, tool usage, content consumption, and sharing behavior. Use these insights to improve user experience and increase engagement depth."
        signals={signals}
      />

      <ChapterInsightCard insights={insights} />

      <Tabs defaultValue="behavior" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="behavior" className="rounded-lg data-[state=active]:bg-background">
            User Behavior
          </TabsTrigger>
          <TabsTrigger value="depth" className="rounded-lg data-[state=active]:bg-background">
            Engagement Depth
          </TabsTrigger>
          <TabsTrigger value="tools" className="rounded-lg data-[state=active]:bg-background">
            Tool Performance
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-background">
            Content
          </TabsTrigger>
          <TabsTrigger value="shares" className="rounded-lg data-[state=active]:bg-background">
            Shares & Viral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavior">
          <UserBehaviorTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="depth">
          <EngagementDepthTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="tools">
          <ToolPerformanceTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="content">
          <ContentPerformanceTab dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="shares">
          <ShareAnalyticsTab dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
