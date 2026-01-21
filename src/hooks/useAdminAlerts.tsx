import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, differenceInHours, formatDistanceToNow } from 'date-fns';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 
  | 'expiring_featured' 
  | 'stale_listings' 
  | 'pending_long' 
  | 'contact_backlog'
  | 'exchange_rate_stale'
  | 'conversion_drop';

export interface AdminAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  count: number;
  href: string;
  timestamp?: string;
}

export function useAdminAlerts() {
  return useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async (): Promise<AdminAlert[]> => {
      const alerts: AdminAlert[] = [];
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 1. Expiring featured items (within 3 days)
      const { count: expiringCount } = await supabase
        .from('homepage_featured_slots')
        .select('*', { count: 'exact', head: true })
        .not('expires_at', 'is', null)
        .lt('expires_at', threeDaysFromNow.toISOString())
        .gt('expires_at', now.toISOString());

      if (expiringCount && expiringCount > 0) {
        alerts.push({
          id: 'expiring-featured',
          type: 'expiring_featured',
          priority: 'high',
          title: 'Featured Items Expiring Soon',
          description: `${expiringCount} featured item${expiringCount > 1 ? 's' : ''} will expire within 3 days`,
          count: expiringCount,
          href: '/admin/featured',
        });
      }

      // 2. Pending items waiting 48+ hours
      const { count: pendingAgentsLong } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', fortyEightHoursAgo.toISOString());

      const { count: pendingListingsLong } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending_review')
        .lt('created_at', fortyEightHoursAgo.toISOString());

      const { count: pendingProjectsLong } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending_review')
        .lt('created_at', fortyEightHoursAgo.toISOString());

      const totalPendingLong = (pendingAgentsLong || 0) + (pendingListingsLong || 0) + (pendingProjectsLong || 0);
      
      if (totalPendingLong > 0) {
        alerts.push({
          id: 'pending-long',
          type: 'pending_long',
          priority: 'critical',
          title: 'Items Awaiting Review 48h+',
          description: `${totalPendingLong} item${totalPendingLong > 1 ? 's have' : ' has'} been waiting for over 48 hours`,
          count: totalPendingLong,
          href: '/admin/review',
        });
      }

      // 3. Unanswered contact forms
      const { count: contactBacklog } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.eq.new');

      if (contactBacklog && contactBacklog > 0) {
        alerts.push({
          id: 'contact-backlog',
          type: 'contact_backlog',
          priority: contactBacklog > 5 ? 'high' : 'medium',
          title: 'Unanswered Contact Forms',
          description: `${contactBacklog} contact submission${contactBacklog > 1 ? 's' : ''} awaiting response`,
          count: contactBacklog,
          href: '/admin/contact',
        });
      }

      // 4. Stale listings (not updated in 60+ days)
      const { count: staleListings } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .lt('updated_at', sixtyDaysAgo.toISOString());

      if (staleListings && staleListings > 5) {
        alerts.push({
          id: 'stale-listings',
          type: 'stale_listings',
          priority: 'medium',
          title: 'Stale Listings',
          description: `${staleListings} published listing${staleListings > 1 ? 's haven\'t' : ' hasn\'t'} been updated in 60+ days`,
          count: staleListings,
          href: '/admin/properties',
        });
      }

      // 5. Exchange rate stale check
      const { data: exchangeRateConstant } = await supabase
        .from('calculator_constants')
        .select('updated_at')
        .eq('constant_key', 'usd_ils_exchange_rate')
        .eq('is_current', true)
        .single();

      if (exchangeRateConstant?.updated_at) {
        const daysSinceUpdate = differenceInDays(now, new Date(exchangeRateConstant.updated_at));
        if (daysSinceUpdate > 7) {
          alerts.push({
            id: 'exchange-rate-stale',
            type: 'exchange_rate_stale',
            priority: 'low',
            title: 'Exchange Rate Outdated',
            description: `USD/ILS rate hasn't been updated in ${daysSinceUpdate} days`,
            count: daysSinceUpdate,
            href: '/admin/settings',
            timestamp: exchangeRateConstant.updated_at,
          });
        }
      }

      // Sort by priority
      const priorityOrder: Record<AlertPriority, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAlertCount() {
  const { data: alerts } = useAdminAlerts();
  return alerts?.filter(a => a.priority === 'critical' || a.priority === 'high').length || 0;
}
