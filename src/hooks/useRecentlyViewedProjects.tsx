import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Project } from '@/types/projects';

const MAX_ITEMS = 20;
const LOCAL_STORAGE_KEY = 'buywise_recently_viewed_projects';

// Session storage helpers (cleared when browser closes)
function getSessionStorage(): string[] {
  try {
    const stored = sessionStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setSessionStorage(items: string[]) {
  try {
    sessionStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Ignore storage errors
  }
}

export function useRecentlyViewedProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [guestItems, setGuestItems] = useState<string[]>([]);

  // Initialize guest items from sessionStorage
  useEffect(() => {
    if (!user) {
      setGuestItems(getSessionStorage());
    }
  }, [user]);

  // Fetch recently viewed project IDs for logged-in users
  const { data: dbItems = [] } = useQuery({
    queryKey: ['recently-viewed-projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('recently_viewed_projects')
        .select('project_id, viewed_at')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(MAX_ITEMS);

      if (error) throw error;
      return data.map(item => item.project_id);
    },
    enabled: !!user,
  });

  // Get the list of project IDs
  const recentProjectIds = user ? dbItems : guestItems;

  // Fetch full project data
  const { data: recentProjects = [], isLoading } = useQuery({
    queryKey: ['recently-viewed-projects-data', recentProjectIds],
    queryFn: async () => {
      if (recentProjectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*, developer:developers(*)')
        .in('id', recentProjectIds);

      if (error) throw error;

      // Sort by the order in recentProjectIds
      type ProjectRow = typeof data[number];
      const projectMap = new Map(data.map(p => [p.id, p]));
      return recentProjectIds
        .map(id => projectMap.get(id))
        .filter((p): p is ProjectRow => p !== undefined) as unknown as Project[];
    },
    enabled: recentProjectIds.length > 0,
  });

  // Add to recently viewed
  const addMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (user) {
        // Upsert for logged-in users
        const { error } = await supabase
          .from('recently_viewed_projects')
          .upsert(
            { user_id: user.id, project_id: projectId, viewed_at: new Date().toISOString() },
            { onConflict: 'user_id,project_id' }
          );
        if (error) throw error;
      } else {
        // Update sessionStorage for guests (cleared when browser closes)
        const current = getSessionStorage();
        const filtered = current.filter(id => id !== projectId);
        const updated = [projectId, ...filtered].slice(0, MAX_ITEMS);
        setSessionStorage(updated);
        setGuestItems(updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recently-viewed-projects'] });
    },
  });

  // Clear all recently viewed
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        const { error } = await supabase
          .from('recently_viewed_projects')
          .delete()
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        sessionStorage.removeItem(LOCAL_STORAGE_KEY);
        setGuestItems([]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recently-viewed-projects'] });
    },
  });

  return {
    recentProjects,
    recentProjectIds,
    isLoading,
    addToRecentlyViewed: (projectId: string) => addMutation.mutate(projectId),
    clearRecentlyViewed: () => clearMutation.mutate(),
  };
}
