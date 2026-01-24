import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

interface PerformanceState {
  navigationStart: number;
  routeLoadTime?: number;
}

export function usePerformanceTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const stateRef = useRef<PerformanceState>({ navigationStart: Date.now() });
  const lastPathRef = useRef<string>('');

  // Track route load time
  useEffect(() => {
    if (location.pathname === lastPathRef.current) return;
    
    const loadTime = Date.now() - stateRef.current.navigationStart;
    
    if (lastPathRef.current) {
      // Track route load time for navigation
      trackRouteLoad(lastPathRef.current, loadTime);
    }

    lastPathRef.current = location.pathname;
    stateRef.current.navigationStart = Date.now();
  }, [location.pathname]);

  // Track Core Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observers: PerformanceObserver[] = [];

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          trackWebVital('lcp', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch (e) {
      console.debug('LCP observer not supported');
    }

    // CLS Observer
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);

      // Report CLS on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && clsValue > 0) {
          trackWebVital('cls', clsValue);
        }
      });
    } catch (e) {
      console.debug('CLS observer not supported');
    }

    // INP Observer (Interaction to Next Paint)
    try {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (entry.interactionId) {
            trackWebVital('inp', entry.duration);
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true } as any);
      observers.push(inpObserver);
    } catch (e) {
      console.debug('INP observer not supported');
    }

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, []);

  const trackRouteLoad = useCallback(async (pagePath: string, loadTimeMs: number) => {
    try {
      await supabase.from('performance_metrics').insert({
        session_id: getSessionId(),
        page_path: pagePath,
        route_load_time_ms: loadTimeMs,
      });
    } catch (error) {
      console.debug('Route load tracking error:', error);
    }
  }, []);

  const trackWebVital = useCallback(async (metric: 'lcp' | 'cls' | 'inp', value: number) => {
    try {
      const data = {
        session_id: getSessionId(),
        page_path: location.pathname,
        lcp_ms: metric === 'lcp' ? Math.round(value) : null,
        cls: metric === 'cls' ? value : null,
        inp_ms: metric === 'inp' ? Math.round(value) : null,
      };

      await supabase.from('performance_metrics').insert([data]);
    } catch (error) {
      console.debug('Web vital tracking error:', error);
    }
  }, [location.pathname]);

  const trackClientError = useCallback(async (
    errorType: 'js_error' | 'map_failure' | 'search_failure' | 'api_error',
    errorMessage: string,
    stackTrace?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      await supabase.from('client_errors').insert({
        session_id: getSessionId(),
        user_id: user?.id || null,
        error_type: errorType,
        error_message: errorMessage,
        stack_trace: stackTrace || null,
        page_path: location.pathname,
        metadata: metadata || null,
      });
    } catch (error) {
      console.debug('Client error tracking error:', error);
    }
  }, [user, location.pathname]);

  const trackIntegrationHealth = useCallback(async (
    integrationType: 'google_maps' | 'geocoding' | 'supabase',
    success: boolean,
    responseTimeMs?: number,
    errorMessage?: string
  ) => {
    try {
      await supabase.from('integration_health').insert({
        session_id: getSessionId(),
        integration_type: integrationType,
        success,
        response_time_ms: responseTimeMs || null,
        error_message: errorMessage || null,
      });
    } catch (error) {
      console.debug('Integration health tracking error:', error);
    }
  }, []);

  return {
    trackClientError,
    trackIntegrationHealth,
    trackRouteLoad,
    trackWebVital,
  };
}

// Global error handler setup (call once in App.tsx)
export function setupGlobalErrorTracking() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const sessionId = sessionStorage.getItem(SESSION_KEY) || 'unknown';
    
    supabase.from('client_errors').insert([{
      session_id: sessionId,
      error_type: 'js_error' as const,
      error_message: event.message,
      stack_trace: event.error?.stack || null,
      page_path: window.location.pathname,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    }]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const sessionId = sessionStorage.getItem(SESSION_KEY) || 'unknown';
    
    supabase.from('client_errors').insert([{
      session_id: sessionId,
      error_type: 'js_error' as const,
      error_message: event.reason?.message || 'Unhandled Promise rejection',
      stack_trace: event.reason?.stack || null,
      page_path: window.location.pathname,
    }]);
  });
}
