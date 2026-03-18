import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useContentVisits } from './useContentVisits';
import { NAV_CONFIG } from '@/lib/navigationConfig';

// Build a map of pathname (without query) → full href for all nav items
// Also include entries with query strings matched by pathname+search
function buildTrackedPaths(): Map<string, string> {
  const map = new Map<string, string>();
  
  for (const section of Object.values(NAV_CONFIG)) {
    for (const column of section.columns) {
      for (const item of column.items) {
        // Store the full href as the key for exact matching
        map.set(item.href, item.href);
      }
    }
  }
  
  return map;
}

const TRACKED_PATHS = buildTrackedPaths();

// Additional standalone paths to track (from LearnNav, MoreNav, etc.)
const STANDALONE_PATHS = new Set([
  '/blog', '/guides', '/tools', '/glossary',
  '/about', '/professionals', '/agencies', '/contact',
  '/principles',
]);

/**
 * Tracks route changes and marks nav items as visited.
 * Place once in Layout.
 */
export function useRouteVisitTracker() {
  const location = useLocation();
  const { markVisited } = useContentVisits();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    
    // Avoid double-tracking the same path
    if (fullPath === lastTracked.current) return;
    lastTracked.current = fullPath;

    // Check exact match (includes query string paths like /listings?status=for_sale)
    if (TRACKED_PATHS.has(fullPath)) {
      markVisited(fullPath, 'nav');
      return;
    }

    // Check pathname-only match for standalone pages
    if (STANDALONE_PATHS.has(location.pathname)) {
      markVisited(location.pathname, 'nav');
      return;
    }

    // Check if pathname matches any tracked path (for query-string variants)
    // e.g., visiting /tools?tool=mortgage should match
    for (const href of TRACKED_PATHS.keys()) {
      const [trackedPath, trackedSearch] = href.split('?');
      if (trackedPath === location.pathname && trackedSearch) {
        const trackedParams = new URLSearchParams(trackedSearch);
        const currentParams = new URLSearchParams(location.search);
        
        let matches = true;
        trackedParams.forEach((value, key) => {
          if (currentParams.get(key) !== value) matches = false;
        });
        
        if (matches) {
          markVisited(href, 'nav');
          return;
        }
      }
    }
  }, [location.pathname, location.search, markVisited]);
}
