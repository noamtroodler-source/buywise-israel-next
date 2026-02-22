import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionData {
  id: string;
  planName: string;
  tier: string;
  entityType: 'agency' | 'developer';
  entityId: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  trialStart: string | null;
  canceledAt: string | null;
  maxListings: number | null;
  maxSeats: number | null;
  maxBlogsPerMonth: number | null;
}

async function fetchEntityForUser(userId: string) {
  // Check if user is agency admin
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('admin_user_id', userId)
    .maybeSingle();

  if (agency) return { entityType: 'agency' as const, entityId: agency.id };

  // Check if user is developer
  const { data: developer } = await supabase
    .from('developers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (developer) return { entityType: 'developer' as const, entityId: developer.id };

  return null;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionData | null> => {
      if (!user) return null;

      const entity = await fetchEntityForUser(user.id);
      if (!entity) return null;

      // Fetch subscription with plan details
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, membership_plans(*)')
        .eq('entity_type', entity.entityType)
        .eq('entity_id', entity.entityId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();


      if (!sub) {
        return {
          id: '',
          planName: 'Free',
          tier: 'free',
          entityType: entity.entityType,
          entityId: entity.entityId,
          status: 'none',
          billingCycle: '',
          currentPeriodEnd: null,
          trialEnd: null,
          trialStart: null,
          canceledAt: null,
          maxListings: null,
          maxSeats: null,
          maxBlogsPerMonth: null,
        };
      }

      const plan = sub.membership_plans as any;

      return {
        id: sub.id,
        planName: plan?.name || 'Unknown',
        tier: plan?.tier || 'unknown',
        entityType: entity.entityType,
        entityId: entity.entityId,
        status: sub.status,
        billingCycle: sub.billing_cycle,
        currentPeriodEnd: sub.current_period_end,
        trialEnd: sub.trial_end,
        trialStart: sub.trial_start,
        canceledAt: sub.canceled_at,
        maxListings: plan?.max_listings || null,
        maxSeats: plan?.max_seats || null,
        maxBlogsPerMonth: plan?.max_blogs_per_month || null,
      };
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
  });
}
