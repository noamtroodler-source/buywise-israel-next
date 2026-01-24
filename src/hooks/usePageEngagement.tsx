import { useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

interface EngagementState {
  startTime: number;
  activeTime: number;
  lastActiveAt: number;
  isVisible: boolean;
  scrollDepthMax: number;
  interactionsCount: number;
  pagePath: string;
  entityType?: string;
  entityId?: string;
}

export function usePageEngagement(entityType?: string, entityId?: string) {
  const { user } = useAuth();
  const location = useLocation();
  const stateRef = useRef<EngagementState>({
    startTime: Date.now(),
    activeTime: 0,
    lastActiveAt: Date.now(),
    isVisible: true,
    scrollDepthMax: 0,
    interactionsCount: 0,
    pagePath: location.pathname,
    entityType,
    entityId,
  });
  const savedRef = useRef(false);

  // Calculate scroll depth percentage
  const calculateScrollDepth = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }, []);

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = stateRef.current;
      const now = Date.now();

      if (document.hidden) {
        // Tab became hidden - save active time
        if (state.isVisible) {
          state.activeTime += now - state.lastActiveAt;
        }
        state.isVisible = false;
      } else {
        // Tab became visible - reset timer
        state.isVisible = true;
        state.lastActiveAt = now;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track scroll depth
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const depth = calculateScrollDepth();
          if (depth > stateRef.current.scrollDepthMax) {
            stateRef.current.scrollDepthMax = depth;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [calculateScrollDepth]);

  // Track interactions
  useEffect(() => {
    const handleInteraction = () => {
      stateRef.current.interactionsCount++;
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Save engagement on page unload or navigation
  const saveEngagement = useCallback(async (exitType: 'back' | 'navigate' | 'close' | 'external') => {
    if (savedRef.current) return;
    savedRef.current = true;

    const state = stateRef.current;
    const now = Date.now();
    
    // Calculate final active time
    let finalActiveTime = state.activeTime;
    if (state.isVisible) {
      finalActiveTime += now - state.lastActiveAt;
    }

    // Determine if engaged (active > 10s OR scroll > 50% OR interactions > 2)
    const engaged = finalActiveTime > 10000 || state.scrollDepthMax > 50 || state.interactionsCount > 2;

    try {
      await supabase.from('page_engagement').insert({
        session_id: getSessionId(),
        user_id: user?.id || null,
        page_path: state.pagePath,
        entity_type: state.entityType || null,
        entity_id: state.entityId || null,
        active_time_ms: finalActiveTime,
        scroll_depth_max: state.scrollDepthMax,
        interactions_count: state.interactionsCount,
        exit_type: exitType,
        engaged,
      });
    } catch (error) {
      console.debug('Page engagement tracking error:', error);
    }
  }, [user]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveEngagement('close');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveEngagement]);

  // Handle navigation (reset state for new page)
  useEffect(() => {
    // Save previous page engagement before resetting
    if (stateRef.current.pagePath !== location.pathname && stateRef.current.startTime !== Date.now()) {
      saveEngagement('navigate');
    }

    // Reset for new page
    savedRef.current = false;
    stateRef.current = {
      startTime: Date.now(),
      activeTime: 0,
      lastActiveAt: Date.now(),
      isVisible: !document.hidden,
      scrollDepthMax: 0,
      interactionsCount: 0,
      pagePath: location.pathname,
      entityType,
      entityId,
    };
  }, [location.pathname, entityType, entityId, saveEngagement]);

  // Manual trigger for engagement tracking
  const trackInteraction = useCallback(() => {
    stateRef.current.interactionsCount++;
  }, []);

  return {
    trackInteraction,
    saveEngagement,
    getEngagementState: () => ({
      activeTime: stateRef.current.activeTime + (stateRef.current.isVisible ? Date.now() - stateRef.current.lastActiveAt : 0),
      scrollDepth: stateRef.current.scrollDepthMax,
      interactions: stateRef.current.interactionsCount,
    }),
  };
}
