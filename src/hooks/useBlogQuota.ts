import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';

export function useBlogQuotaCheck(authorType: string | undefined, profileId: string | undefined) {
  const { user } = useAuth();
  const { data: sub } = useSubscription();

  const { data: used = 0, isLoading } = useQuery({
    queryKey: ['blog-quota-used', profileId],
    queryFn: async () => {
      if (!profileId) return 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count, error } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_profile_id', profileId)
        .in('verification_status', ['pending_review', 'approved'])
        .gte('submitted_at', startOfMonth);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user && !!profileId,
  });

  const limit = sub?.maxBlogsPerMonth ?? null;
  const canSubmit = limit === null || used < limit;

  return { used, limit, canSubmit, isLoading };
}
