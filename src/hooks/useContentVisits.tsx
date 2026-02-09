import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { safeGetJSON, safeSetJSON, safeRemove } from '@/utils/safeStorage';
import { NAV_CONFIG } from '@/lib/navigationConfig';

const STORAGE_KEY = 'buywise_content_visits';
const EXPIRY_DAYS = 30;

interface LocalVisit {
  type: string;
  visitedAt: string;
  count: number;
}

type LocalVisits = Record<string, LocalVisit>;

// Type guard for localStorage data
function isValidLocalVisits(data: unknown): data is LocalVisits {
  if (typeof data !== 'object' || data === null) return false;
  return Object.values(data).every(
    (v) =>
      typeof v === 'object' &&
      v !== null &&
      'type' in v &&
      'visitedAt' in v &&
      'count' in v
  );
}

// Check if a local visit is expired (30+ days old)
function isExpired(visitedAt: string): boolean {
  const visitDate = new Date(visitedAt);
  const expiryDate = new Date(visitDate.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return expiryDate < new Date();
}

// Get visits from localStorage, filtering out expired ones
function getLocalVisits(): LocalVisits {
  const raw = safeGetJSON<LocalVisits>(STORAGE_KEY, {}, isValidLocalVisits);
  // Filter out expired visits
  const filtered: LocalVisits = {};
  for (const [path, visit] of Object.entries(raw)) {
    if (!isExpired(visit.visitedAt)) {
      filtered[path] = visit;
    }
  }
  // If we filtered some out, save the cleaned version
  if (Object.keys(filtered).length !== Object.keys(raw).length) {
    safeSetJSON(STORAGE_KEY, filtered);
  }
  return filtered;
}

// Save visits to localStorage
function saveLocalVisits(visits: LocalVisits): void {
  safeSetJSON(STORAGE_KEY, visits);
}

// Clear localStorage visits after sync
function clearLocalVisits(): void {
  safeRemove(STORAGE_KEY);
}

// Get all items in a navigation section
function getSectionItems(sectionKey: string): string[] {
  const section = NAV_CONFIG[sectionKey];
  if (!section) return [];
  return section.columns.flatMap(col => col.items.map(item => item.href));
}

export function useContentVisits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localVisits, setLocalVisits] = useState<LocalVisits>(() => getLocalVisits());
  
  // Track which sections we've already cleared to prevent infinite loops
  const clearedSectionsRef = useRef<Set<string>>(new Set());

  // Fetch visits from database for authenticated users (only non-expired)
  const { data: dbVisits = [] } = useQuery({
    queryKey: ['content-visits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('content_visits')
        .select('content_path, content_type, visit_count, expires_at')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString()); // Only non-expired
      
      if (error) {
        console.error('Failed to fetch content visits:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Mutation to mark content as visited in database
  const markVisitedMutation = useMutation({
    mutationFn: async ({ path, type }: { path: string; type: string }) => {
      if (!user) return;
      
      const { error } = await supabase
        .from('content_visits')
        .upsert(
          {
            user_id: user.id,
            content_path: path,
            content_type: type,
            last_visited_at: new Date().toISOString(),
            visit_count: 1,
          },
          {
            onConflict: 'user_id,content_path',
            ignoreDuplicates: false,
          }
        );
      
      if (error) {
        // If it's a duplicate, update the visit count
        if (error.code === '23505') {
          await supabase
            .from('content_visits')
            .update({
              last_visited_at: new Date().toISOString(),
              visit_count: supabase.rpc ? 1 : 1, // Increment handled separately
            })
            .eq('user_id', user.id)
            .eq('content_path', path);
        } else {
          console.error('Failed to mark content visited:', error);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-visits', user?.id] });
    },
  });

  // Sync localStorage visits to database on login
  const syncLocalToDatabase = useCallback(async () => {
    if (!user) return;
    
    const local = getLocalVisits();
    const paths = Object.keys(local);
    
    if (paths.length === 0) return;
    
    // Batch insert/upsert all local visits
    const records = paths.map((path) => ({
      user_id: user.id,
      content_path: path,
      content_type: local[path].type,
      first_visited_at: local[path].visitedAt,
      last_visited_at: local[path].visitedAt,
      visit_count: local[path].count,
    }));
    
    const { error } = await supabase
      .from('content_visits')
      .upsert(records, {
        onConflict: 'user_id,content_path',
        ignoreDuplicates: false,
      });
    
    if (error) {
      console.error('Failed to sync local visits:', error);
    } else {
      clearLocalVisits();
      setLocalVisits({});
      queryClient.invalidateQueries({ queryKey: ['content-visits', user.id] });
    }
  }, [user, queryClient]);

  // Sync on login
  useEffect(() => {
    if (user) {
      syncLocalToDatabase();
    }
  }, [user, syncLocalToDatabase]);

  // Build visited paths set from both sources
  const visitedPaths = useMemo(() => {
    const paths = new Set<string>();
    
    // Add database visits for authenticated users
    if (user && dbVisits) {
      dbVisits.forEach((v) => paths.add(v.content_path));
    }
    
    // Add localStorage visits for guests (or while syncing)
    if (!user) {
      Object.keys(localVisits).forEach((path) => paths.add(path));
    }
    
    return paths;
  }, [user, dbVisits, localVisits]);

  // Check if a path has been visited
  const isVisited = useCallback(
    (path: string): boolean => {
      return visitedPaths.has(path);
    },
    [visitedPaths]
  );

  // Mark a path as visited
  const markVisited = useCallback(
    (path: string, type: string) => {
      if (user) {
        // Authenticated: save to database
        markVisitedMutation.mutate({ path, type });
      } else {
        // Guest: save to localStorage
        setLocalVisits((prev) => {
          const existing = prev[path];
          const updated = {
            ...prev,
            [path]: {
              type,
              visitedAt: existing?.visitedAt || new Date().toISOString(),
              count: (existing?.count || 0) + 1,
            },
          };
          saveLocalVisits(updated);
          return updated;
        });
      }
    },
    [user, markVisitedMutation]
  );

  // Get visit count for a path
  const getVisitCount = useCallback(
    (path: string): number => {
      if (user && dbVisits) {
        const visit = dbVisits.find((v) => v.content_path === path);
        return visit?.visit_count || 0;
      }
      return localVisits[path]?.count || 0;
    },
    [user, dbVisits, localVisits]
  );

  // Check if all items in a section are visited
  const isSectionComplete = useCallback(
    (sectionKey: string): boolean => {
      const sectionItems = getSectionItems(sectionKey);
      if (sectionItems.length === 0) return false;
      return sectionItems.every(href => visitedPaths.has(href));
    },
    [visitedPaths]
  );

  // Clear section-specific visits
  const clearSectionVisits = useCallback(async (sectionKey: string) => {
    const sectionItems = getSectionItems(sectionKey);
    if (sectionItems.length === 0) return;
    
    if (user) {
      const { error } = await supabase
        .from('content_visits')
        .delete()
        .eq('user_id', user.id)
        .in('content_path', sectionItems);
      
      if (error) {
        console.error('Failed to clear section visits:', error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['content-visits', user.id] });
      }
    } else {
      setLocalVisits(prev => {
        const updated = { ...prev };
        sectionItems.forEach(path => delete updated[path]);
        saveLocalVisits(updated);
        return updated;
      });
    }
  }, [user, queryClient]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    if (user) {
      const { error } = await supabase
        .from('content_visits')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Failed to clear history:', error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['content-visits', user.id] });
      }
    } else {
      clearLocalVisits();
      setLocalVisits({});
    }
    // Reset cleared sections tracker
    clearedSectionsRef.current.clear();
  }, [user, queryClient]);

  // Auto-clear sections when completed
  useEffect(() => {
    const sections = ['buy', 'rent', 'projects'];
    
    sections.forEach(sectionKey => {
      // Skip if we've already cleared this section in this session
      if (clearedSectionsRef.current.has(sectionKey)) return;
      
      if (isSectionComplete(sectionKey)) {
        clearedSectionsRef.current.add(sectionKey);
        clearSectionVisits(sectionKey);
      }
    });
  }, [isSectionComplete, clearSectionVisits]);

  return {
    visitedPaths,
    isVisited,
    markVisited,
    getVisitCount,
    isSectionComplete,
    clearSectionVisits,
    clearHistory,
  };
}
