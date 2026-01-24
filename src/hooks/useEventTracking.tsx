import { useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Session management
const SESSION_KEY = 'analytics_session_id';
const SESSION_EXPIRY_KEY = 'analytics_session_expiry';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function getOrCreateSessionId(): string {
  const existingSession = sessionStorage.getItem(SESSION_KEY);
  const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  
  if (existingSession && expiry && Date.now() < parseInt(expiry)) {
    // Extend session
    sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
    return existingSession;
  }
  
  // Create new session
  const newSession = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, newSession);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
  return newSession;
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getUTMParams(): Record<string, string | null> {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
  };
}

function getUserRole(user: any): string {
  if (!user) return 'anonymous';
  // This could be enhanced to check actual roles from user_roles table
  return 'user';
}

export type EventType = 'click' | 'view' | 'search' | 'filter' | 'scroll' | 'submit' | 'hover' | 'navigate';
export type EventCategory = 'navigation' | 'engagement' | 'conversion' | 'search' | 'tool' | 'content';

interface TrackEventOptions {
  component?: string;
  properties?: Record<string, any>;
}

export function useEventTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPageView = useRef<string>('');

  // Track page views automatically
  useEffect(() => {
    if (location.pathname !== lastPageView.current) {
      lastPageView.current = location.pathname;
      trackEvent('view', 'page_view', 'navigation', {
        properties: { path: location.pathname, search: location.search }
      });
    }
  }, [location.pathname]);

  const trackEvent = useCallback(async (
    eventType: EventType,
    eventName: string,
    category: EventCategory,
    options?: TrackEventOptions
  ) => {
    try {
      const sessionId = getOrCreateSessionId();
      const deviceInfo = {
        device_type: getDeviceType(),
        viewport_width: window.innerWidth,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      };
      const utmParams = getUTMParams();

      await supabase.from('user_events').insert({
        session_id: sessionId,
        user_id: user?.id || null,
        user_role: getUserRole(user),
        event_type: eventType,
        event_name: eventName,
        event_category: category,
        page_path: location.pathname,
        component: options?.component || null,
        properties: options?.properties || {},
        ...deviceInfo,
        ...utmParams,
      });
    } catch (error) {
      // Silently fail - don't break the app for analytics
      console.debug('Analytics tracking error:', error);
    }
  }, [user, location.pathname]);

  // Convenience methods for common events
  const trackClick = useCallback((
    eventName: string,
    component?: string,
    properties?: Record<string, any>
  ) => {
    return trackEvent('click', eventName, 'engagement', { component, properties });
  }, [trackEvent]);

  const trackConversion = useCallback((
    eventName: string,
    properties?: Record<string, any>
  ) => {
    return trackEvent('submit', eventName, 'conversion', { properties });
  }, [trackEvent]);

  const trackToolUsage = useCallback((
    toolName: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    return trackEvent('click', `${toolName}_${action}`, 'tool', { 
      component: toolName, 
      properties 
    });
  }, [trackEvent]);

  const trackScroll = useCallback((
    component: string,
    scrollDepth: number,
    properties?: Record<string, any>
  ) => {
    return trackEvent('scroll', 'scroll_depth', 'engagement', { 
      component, 
      properties: { scroll_depth: scrollDepth, ...properties } 
    });
  }, [trackEvent]);

  return { 
    trackEvent, 
    trackClick, 
    trackConversion, 
    trackToolUsage,
    trackScroll,
    sessionId: getOrCreateSessionId()
  };
}
