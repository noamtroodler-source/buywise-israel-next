import { Skeleton } from '@/components/ui/skeleton';
import { InsightCard } from '@/components/tools/shared/InsightCard';

interface AIMarketInsightProps {
  insight: string | null | undefined;
  isLoading: boolean;
}

export function AIMarketInsight({ insight, isLoading }: AIMarketInsightProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  if (!insight) return null;

  return <InsightCard insights={[insight]} />;
}
