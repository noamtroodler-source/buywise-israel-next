import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';

interface ListingLimitResult {
  canCreate: boolean;
  currentCount: number;
  maxListings: number | null;
  isLoading: boolean;
  needsSubscription: boolean;
}

export function useListingLimitCheck(entityType: 'agency' | 'developer'): ListingLimitResult {
  const { user } = useAuth();
  const { data: sub, isLoading: subLoading } = useSubscription();

  const { data: currentCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['listingCount', entityType, user?.id],
    queryFn: async () => {
      if (!user) return 0;

      if (entityType === 'agency') {
        // Get agent profile, then count non-draft properties
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!agent) return 0;

        const { count } = await supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', agent.id)
          .neq('verification_status', 'draft');

        return count || 0;
      } else {
        const { data: dev } = await supabase
          .from('developers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!dev) return 0;

        const { count } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('developer_id', dev.id)
          .neq('verification_status', 'draft');

        return count || 0;
      }
    },
    enabled: !!user,
  });

  const isLoading = subLoading || countLoading;
  const maxListings = sub?.maxListings ?? null;
  const needsSubscription = !sub || sub.status === 'none';

  // Enterprise (null maxListings) = unlimited
  // No subscription = cannot create (must subscribe)
  const canCreate = isLoading
    ? true // Optimistic while loading
    : needsSubscription
    ? false
    : maxListings === null
    ? true
    : currentCount < maxListings;

  return { canCreate, currentCount, maxListings, isLoading, needsSubscription };
}
