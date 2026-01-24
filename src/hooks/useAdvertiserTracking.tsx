import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ActorType = 'agent' | 'developer' | 'agency_admin';
type ActionType = 
  | 'login'
  | 'dashboard_view'
  | 'listing_create'
  | 'listing_edit'
  | 'listing_delete'
  | 'listing_submit'
  | 'listing_renew'
  | 'inquiry_view'
  | 'inquiry_respond'
  | 'inquiry_mark_read'
  | 'analytics_view'
  | 'settings_update'
  | 'profile_update'
  | 'team_invite'
  | 'team_remove'
  | 'announcement_create';

interface TrackActivityOptions {
  actorId: string;
  actorType: ActorType;
  actionType: ActionType;
  actionDetail?: string;
  entityType?: 'property' | 'project' | 'inquiry' | 'settings' | 'team' | 'announcement';
  entityId?: string;
  metadata?: Record<string, any>;
}

export function useAdvertiserTracking() {
  const { user } = useAuth();

  const trackActivity = useCallback(async (options: TrackActivityOptions) => {
    if (!user?.id) return;

    try {
      await supabase.from('advertiser_activity').insert({
        user_id: user.id,
        actor_type: options.actorType,
        actor_id: options.actorId,
        action_type: options.actionType,
        action_detail: options.actionDetail || null,
        entity_type: options.entityType || null,
        entity_id: options.entityId || null,
        metadata: options.metadata || {},
      });
    } catch (error) {
      console.debug('Advertiser tracking error:', error);
    }
  }, [user?.id]);

  // Convenience methods for common actions
  const trackDashboardView = useCallback((
    actorId: string,
    actorType: ActorType,
    section?: string
  ) => {
    return trackActivity({
      actorId,
      actorType,
      actionType: 'dashboard_view',
      actionDetail: section,
    });
  }, [trackActivity]);

  const trackListingAction = useCallback((
    actorId: string,
    actorType: ActorType,
    action: 'create' | 'edit' | 'delete' | 'submit' | 'renew',
    entityType: 'property' | 'project',
    entityId: string,
    metadata?: Record<string, any>
  ) => {
    return trackActivity({
      actorId,
      actorType,
      actionType: `listing_${action}` as ActionType,
      entityType,
      entityId,
      metadata,
    });
  }, [trackActivity]);

  const trackInquiryAction = useCallback((
    actorId: string,
    actorType: ActorType,
    action: 'view' | 'respond' | 'mark_read',
    inquiryId: string,
    metadata?: Record<string, any>
  ) => {
    return trackActivity({
      actorId,
      actorType,
      actionType: `inquiry_${action}` as ActionType,
      entityType: 'inquiry',
      entityId: inquiryId,
      metadata,
    });
  }, [trackActivity]);

  const trackSettingsUpdate = useCallback((
    actorId: string,
    actorType: ActorType,
    settingChanged: string,
    metadata?: Record<string, any>
  ) => {
    return trackActivity({
      actorId,
      actorType,
      actionType: 'settings_update',
      actionDetail: settingChanged,
      entityType: 'settings',
      metadata,
    });
  }, [trackActivity]);

  const trackAnalyticsView = useCallback((
    actorId: string,
    actorType: ActorType,
    analyticsSection?: string
  ) => {
    return trackActivity({
      actorId,
      actorType,
      actionType: 'analytics_view',
      actionDetail: analyticsSection,
    });
  }, [trackActivity]);

  return {
    trackActivity,
    trackDashboardView,
    trackListingAction,
    trackInquiryAction,
    trackSettingsUpdate,
    trackAnalyticsView,
  };
}
