import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Session management (reusing the same session as event tracking)
const SESSION_KEY = 'analytics_session_id';
const SESSION_EXPIRY_KEY = 'analytics_session_expiry';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function getOrCreateSessionId(): string {
  const existingSession = sessionStorage.getItem(SESSION_KEY);
  const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  
  if (existingSession && expiry && Date.now() < parseInt(expiry)) {
    sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
    return existingSession;
  }
  
  const newSession = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, newSession);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
  return newSession;
}

export type ShareMethod = 'copy_link' | 'whatsapp' | 'native_share';
export type ShareEntityType = 'property' | 'project' | 'area' | 'tool';

interface TrackShareOptions {
  entityType: ShareEntityType;
  entityId: string;
  shareMethod: ShareMethod;
}

export function useShareTracking() {
  const { user } = useAuth();

  const trackShare = useCallback(async ({ entityType, entityId, shareMethod }: TrackShareOptions) => {
    try {
      const sessionId = getOrCreateSessionId();
      
      await supabase.from('share_events').insert({
        user_id: user?.id || null,
        session_id: sessionId,
        entity_type: entityType,
        entity_id: entityId,
        share_method: shareMethod,
        page_path: window.location.pathname,
      });
    } catch (error) {
      // Silently fail - don't break the app for analytics
      console.debug('Share tracking error:', error);
    }
  }, [user]);

  return { trackShare };
}
