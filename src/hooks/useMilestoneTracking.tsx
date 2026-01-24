import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

type MilestoneType = 
  | 'used_filters'
  | 'viewed_listing'
  | 'saved_listing'
  | 'ran_tool'
  | 'started_inquiry'
  | 'completed_inquiry'
  | 'created_account'
  | 'completed_onboarding'
  | 'set_buyer_profile'
  | 'first_search'
  | 'viewed_5_listings'
  | 'viewed_10_listings'
  | 'returned_7d'
  | 'returned_30d';

export function useMilestoneTracking() {
  const { user } = useAuth();

  const trackMilestone = useCallback(async (
    milestone: MilestoneType,
    metadata?: Record<string, any>
  ) => {
    const sessionId = getSessionId();

    try {
      // Try to upsert - increment count if exists, create if not
      const { data: existing } = await supabase
        .from('user_milestones')
        .select('id, reach_count')
        .eq('session_id', sessionId)
        .eq('milestone', milestone)
        .maybeSingle();

      if (existing) {
        // Update count
        await supabase
          .from('user_milestones')
          .update({ 
            reach_count: existing.reach_count + 1,
            metadata: metadata || null,
          })
          .eq('id', existing.id);
      } else {
        // Insert new milestone
        await supabase.from('user_milestones').insert({
          session_id: sessionId,
          user_id: user?.id || null,
          milestone,
          reach_count: 1,
          metadata: metadata || null,
        });
      }
    } catch (error) {
      console.debug('Milestone tracking error:', error);
    }
  }, [user]);

  // Convenience methods for common milestones
  const trackUsedFilters = useCallback((filterCount: number) => {
    trackMilestone('used_filters', { filter_count: filterCount });
  }, [trackMilestone]);

  const trackViewedListing = useCallback((listingId: string, listingType: 'property' | 'project') => {
    trackMilestone('viewed_listing', { listing_id: listingId, listing_type: listingType });
  }, [trackMilestone]);

  const trackSavedListing = useCallback((listingId: string) => {
    trackMilestone('saved_listing', { listing_id: listingId });
  }, [trackMilestone]);

  const trackRanTool = useCallback((toolName: string) => {
    trackMilestone('ran_tool', { tool_name: toolName });
  }, [trackMilestone]);

  const trackStartedInquiry = useCallback((listingId: string) => {
    trackMilestone('started_inquiry', { listing_id: listingId });
  }, [trackMilestone]);

  const trackCompletedInquiry = useCallback((listingId: string) => {
    trackMilestone('completed_inquiry', { listing_id: listingId });
  }, [trackMilestone]);

  const trackCreatedAccount = useCallback(() => {
    trackMilestone('created_account');
  }, [trackMilestone]);

  const trackCompletedOnboarding = useCallback(() => {
    trackMilestone('completed_onboarding');
  }, [trackMilestone]);

  const trackSetBuyerProfile = useCallback((buyerType: string) => {
    trackMilestone('set_buyer_profile', { buyer_type: buyerType });
  }, [trackMilestone]);

  const trackFirstSearch = useCallback(() => {
    trackMilestone('first_search');
  }, [trackMilestone]);

  return {
    trackMilestone,
    trackUsedFilters,
    trackViewedListing,
    trackSavedListing,
    trackRanTool,
    trackStartedInquiry,
    trackCompletedInquiry,
    trackCreatedAccount,
    trackCompletedOnboarding,
    trackSetBuyerProfile,
    trackFirstSearch,
  };
}
