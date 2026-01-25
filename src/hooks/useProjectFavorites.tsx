import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { safeSessionGet, safeSessionSet } from '@/utils/sessionStorage';

const GUEST_PROJECT_FAVORITES_KEY = 'buywise_guest_project_favorites';

export function useProjectFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Guest favorites state (sessionStorage)
  const [guestFavoriteIds, setGuestFavoriteIds] = useState<string[]>([]);
  
  // Load guest favorites on mount
  useEffect(() => {
    if (!user) {
      setGuestFavoriteIds(safeSessionGet<string[]>(GUEST_PROJECT_FAVORITES_KEY, []));
    }
  }, [user]);

  const { data: projectFavorites = [], isLoading } = useQuery({
    queryKey: ['projectFavorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('project_favorites')
        .select(`
          id,
          project_id,
          created_at,
          project:project_id (
            *,
            developer:developer_id (*)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: dbProjectFavoriteIds = [] } = useQuery({
    queryKey: ['projectFavoriteIds', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('project_favorites')
        .select('project_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(f => f.project_id) || [];
    },
    enabled: !!user,
  });

  // Fetch guest project details
  const { data: guestProjects = [] } = useQuery({
    queryKey: ['guest-project-favorites-data', guestFavoriteIds],
    queryFn: async () => {
      if (guestFavoriteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*, developer:developer_id (*)')
        .in('id', guestFavoriteIds);

      if (error) throw error;
      
      // Sort by the order in guestFavoriteIds
      const projectMap = new Map(data?.map(p => [p.id, p]) || []);
      return guestFavoriteIds
        .map(id => projectMap.get(id))
        .filter(Boolean);
    },
    enabled: !user && guestFavoriteIds.length > 0,
  });

  // Combined favorite IDs
  const projectFavoriteIds = user ? dbProjectFavoriteIds : guestFavoriteIds;

  const addProjectFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) {
        // Guest: use sessionStorage
        const current = safeSessionGet<string[]>(GUEST_PROJECT_FAVORITES_KEY, []);
        const filtered = current.filter(id => id !== projectId);
        const updated = [projectId, ...filtered];
        safeSessionSet(GUEST_PROJECT_FAVORITES_KEY, updated);
        setGuestFavoriteIds(updated);
        return;
      }
      
      const { error } = await supabase
        .from('project_favorites')
        .insert({ 
          user_id: user.id, 
          project_id: projectId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['projectFavorites'] });
        queryClient.invalidateQueries({ queryKey: ['projectFavoriteIds'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['guest-project-favorites-data'] });
      }
      toast.success('Project saved to favorites');
    },
    onError: (error) => {
      toast.error('Failed to save project: ' + (error as Error).message);
    },
  });

  const removeProjectFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) {
        // Guest: use sessionStorage
        const current = safeSessionGet<string[]>(GUEST_PROJECT_FAVORITES_KEY, []);
        const updated = current.filter(id => id !== projectId);
        safeSessionSet(GUEST_PROJECT_FAVORITES_KEY, updated);
        setGuestFavoriteIds(updated);
        return;
      }
      
      const { error } = await supabase
        .from('project_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['projectFavorites'] });
        queryClient.invalidateQueries({ queryKey: ['projectFavoriteIds'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['guest-project-favorites-data'] });
      }
      toast.success('Project removed from favorites');
    },
    onError: (error) => {
      toast.error('Failed to remove project: ' + (error as Error).message);
    },
  });

  const toggleProjectFavorite = useCallback((projectId: string) => {
    if (projectFavoriteIds.includes(projectId)) {
      removeProjectFavorite.mutate(projectId);
    } else {
      addProjectFavorite.mutate(projectId);
    }
  }, [projectFavoriteIds, addProjectFavorite, removeProjectFavorite]);

  const isProjectFavorite = useCallback((projectId: string) => projectFavoriteIds.includes(projectId), [projectFavoriteIds]);

  return {
    projectFavorites: user ? projectFavorites : guestProjects.map((p: any) => ({
      project_id: p.id,
      project: p,
    })),
    projectFavoriteIds,
    isLoading: user ? isLoading : false,
    addProjectFavorite: addProjectFavorite.mutate,
    removeProjectFavorite: removeProjectFavorite.mutate,
    toggleProjectFavorite,
    isProjectFavorite,
    isToggling: addProjectFavorite.isPending || removeProjectFavorite.isPending,
    isGuest: !user,
  };
}
