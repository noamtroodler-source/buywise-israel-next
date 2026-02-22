import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';


// Tier upgrade mapping
const NEXT_TIER: Record<string, string> = {
  starter: 'Growth',
  growth: 'Professional',
  professional: 'Enterprise',
};

export interface ListingLimitResult {
  canCreate: boolean;
  isOverLimit: boolean;
  currentCount: number;
  maxListings: number | null;
  isLoading: boolean;
  needsSubscription: boolean;
  nextTierName: string | null;
  overageRate?: number | null;
  usagePercent: number;
}

export function useListingLimitCheck(entityType: 'agency' | 'developer'): ListingLimitResult {
  const { user } = useAuth();
  const { data: sub, isLoading: subLoading } = useSubscription();

  const { data: currentCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['listingCount', entityType, user?.id],
    queryFn: async () => {
      if (!user) return 0;

      if (entityType === 'agency') {
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
  const tier = sub?.tier || '';
  const nextTierName = NEXT_TIER[tier] || null;
  const usagePercent = maxListings ? Math.min(100, Math.round((currentCount / maxListings) * 100)) : 0;

  // Over limit = has a finite limit and is at or beyond it
  const isOverLimit = !isLoading && !needsSubscription && maxListings !== null && currentCount >= maxListings;

  // Overages are allowed — canCreate is only false if no subscription at all
  const canCreate = isLoading
    ? true // Optimistic while loading
    : needsSubscription
    ? false
    : true; // Always allowed with subscription (overage charges apply when over limit)

  return { canCreate, isOverLimit, currentCount, maxListings, isLoading, needsSubscription, nextTierName, overageRate: null, usagePercent };
}
