import { useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

interface ContentEngagementState {
  startTime: number;
  activeTime: number;
  lastActiveAt: number;
  isVisible: boolean;
  scrollDepthMax: number;
  contentHeight: number;
}

export function useContentEngagement(
  contentType: 'blog_post' | 'guide' | 'glossary',
  contentId: string
) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const stateRef = useRef<ContentEngagementState>({
    startTime: Date.now(),
    activeTime: 0,
    lastActiveAt: Date.now(),
    isVisible: true,
    scrollDepthMax: 0,
    contentHeight: 0,
  });
  const savedRef = useRef(false);
  const contentRef = useRef<HTMLElement | null>(null);

  // Set content element reference
  const setContentRef = useCallback((element: HTMLElement | null) => {
    contentRef.current = element;
    if (element) {
      stateRef.current.contentHeight = element.scrollHeight;
    }
  }, []);

  // Calculate completion percentage based on scroll position within content
  const calculateCompletion = useCallback(() => {
    if (!contentRef.current) {
      return stateRef.current.scrollDepthMax;
    }

    const rect = contentRef.current.getBoundingClientRect();
    const contentTop = rect.top + window.scrollY;
    const contentHeight = rect.height;
    const scrollPosition = window.scrollY + window.innerHeight;
    
    const scrolledIntoContent = scrollPosition - contentTop;
    const completion = Math.min(100, Math.max(0, Math.round((scrolledIntoContent / contentHeight) * 100)));
    
    return completion;
  }, []);

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = stateRef.current;
      const now = Date.now();

      if (document.hidden) {
        if (state.isVisible) {
          state.activeTime += now - state.lastActiveAt;
        }
        state.isVisible = false;
      } else {
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
          const completion = calculateCompletion();
          if (completion > stateRef.current.scrollDepthMax) {
            stateRef.current.scrollDepthMax = completion;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [calculateCompletion]);

  // Save engagement
  const saveEngagement = useCallback(async (
    nextAction?: 'search' | 'tool' | 'inquiry' | 'another_article' | 'exit',
    nextActionTarget?: string
  ) => {
    if (savedRef.current) return;
    savedRef.current = true;

    const state = stateRef.current;
    const now = Date.now();
    
    let finalActiveTime = state.activeTime;
    if (state.isVisible) {
      finalActiveTime += now - state.lastActiveAt;
    }

    try {
      await supabase.from('content_engagement').insert({
        session_id: getSessionId(),
        user_id: user?.id || null,
        content_type: contentType,
        content_id: contentId,
        completion_percent: state.scrollDepthMax,
        scroll_depth_max: state.scrollDepthMax,
        active_time_ms: finalActiveTime,
        next_action: nextAction || null,
        next_action_target: nextActionTarget || null,
      });
    } catch (error) {
      console.debug('Content engagement tracking error:', error);
    }
  }, [contentType, contentId, user]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveEngagement('exit');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveEngagement]);

  // Track navigation with next action
  const navigateWithTracking = useCallback((
    path: string,
    nextAction: 'search' | 'tool' | 'inquiry' | 'another_article'
  ) => {
    saveEngagement(nextAction, path);
    navigate(path);
  }, [saveEngagement, navigate]);

  // Reset state when content changes
  useEffect(() => {
    savedRef.current = false;
    stateRef.current = {
      startTime: Date.now(),
      activeTime: 0,
      lastActiveAt: Date.now(),
      isVisible: !document.hidden,
      scrollDepthMax: 0,
      contentHeight: contentRef.current?.scrollHeight || 0,
    };
  }, [contentId]);

  return {
    setContentRef,
    saveEngagement,
    navigateWithTracking,
    getEngagementState: () => ({
      completionPercent: stateRef.current.scrollDepthMax,
      activeTimeMs: stateRef.current.activeTime + (stateRef.current.isVisible ? Date.now() - stateRef.current.lastActiveAt : 0),
    }),
  };
}
