import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FreshnessInfo {
  lastReviewed: string | null;
  nextDue: string | null;
  isStale: boolean;
  isDueSoon: boolean;
  label: string;
  category: string;
}

export function useDataFreshness() {
  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['data-review-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_review_schedule')
        .select('*')
        .order('category');
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });

  function getCategoryFreshness(category: string): FreshnessInfo | null {
    const item = schedule.find(s => s.category === category);
    if (!item) return null;

    const now = new Date();
    const nextDue = item.next_review_due ? new Date(item.next_review_due) : null;
    const isStale = nextDue ? nextDue < now : false;
    const isDueSoon = nextDue 
      ? !isStale && (nextDue.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000
      : false;

    return {
      lastReviewed: item.last_reviewed_at,
      nextDue: item.next_review_due,
      isStale,
      isDueSoon,
      label: item.label,
      category: item.category,
    };
  }

  function getMultipleFreshness(categories: string[]): FreshnessInfo[] {
    return categories
      .map(getCategoryFreshness)
      .filter((f): f is FreshnessInfo => f !== null);
  }

  return { schedule, isLoading, getCategoryFreshness, getMultipleFreshness };
}
