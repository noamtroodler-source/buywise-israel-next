import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';


export interface SeatLimitResult {
  canInvite: boolean;
  isOverLimit: boolean;
  currentSeats: number;
  maxSeats: number | null;
  isLoading: boolean;
  needsSubscription: boolean;
  overageRate: number | null;
  usagePercent: number;
}

export function useSeatLimitCheck(): SeatLimitResult {
  const { user } = useAuth();
  const { data: sub, isLoading: subLoading } = useSubscription();

  const { data: currentSeats = 0, isLoading: countLoading } = useQuery({
    queryKey: ['seatCount', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Find the agency this user admins
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('admin_user_id', user.id)
        .maybeSingle();

      if (!agency) return 0;

      const { count } = await supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', agency.id);

      return count || 0;
    },
    enabled: !!user,
  });


  const isLoading = subLoading || countLoading;
  const maxSeats = sub?.maxSeats ?? null;
  const needsSubscription = !sub || sub.status === 'none';
  const usagePercent = maxSeats ? Math.min(100, Math.round((currentSeats / maxSeats) * 100)) : 0;

  // Over limit = has a subscription, has a finite limit, and is at or beyond it
  const isOverLimit = !isLoading && !needsSubscription && maxSeats !== null && currentSeats >= maxSeats;

  // Overages are allowed — canInvite is only false if no subscription at all
  const canInvite = isLoading
    ? true
    : needsSubscription
    ? false
    : true; // Always allowed with subscription (overage charges apply)

  return { canInvite, isOverLimit, currentSeats, maxSeats, isLoading, needsSubscription, overageRate: null, usagePercent };
}
