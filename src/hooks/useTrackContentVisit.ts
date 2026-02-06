import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useContentVisits } from '@/hooks/useContentVisits';

type ContentType = 'guide' | 'tool' | 'area' | 'blog' | 'glossary';

/**
 * Hook to automatically track content visits on page mount.
 * Call this at the top level of content pages (guides, tools, areas, blog, glossary).
 * 
 * @param contentType - The type of content being tracked
 */
export function useTrackContentVisit(contentType: ContentType): void {
  const { pathname, search } = useLocation();
  const { markVisited } = useContentVisits();
  const hasTracked = useRef<string | null>(null);

  useEffect(() => {
    const fullPath = pathname + search;
    
    // Only track once per path per component mount
    if (hasTracked.current === fullPath) return;
    
    hasTracked.current = fullPath;
    markVisited(fullPath, contentType);
  }, [pathname, search, contentType, markVisited]);
}
