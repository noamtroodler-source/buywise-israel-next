import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

/**
 * Hook to track page views on route changes
 * Add this to your App.tsx inside the BrowserRouter
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);
}

/**
 * Component version for use inside Router
 */
export function PageTracker(): null {
  usePageTracking();
  return null;
}
