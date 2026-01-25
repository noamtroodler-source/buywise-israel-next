import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

export function useProjectFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use shared context for guest project favorites
  const { guestProjectFavoriteIds, setGuestProjectFavoriteIds } = useFavoritesContext();

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
    queryKey: ['guest-project-favorites-data', guestProjectFavoriteIds],
    queryFn: async () => {
      if (guestProjectFavoriteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*, developer:developer_id (*)')
        .in('id', guestProjectFavoriteIds);

      if (error) throw error;
      
      // Sort by the order in guestProjectFavoriteIds
      const projectMap = new Map(data?.map(p => [p.id, p]) || []);
      return guestProjectFavoriteIds
        .map(id => projectMap.get(id))
        .filter(Boolean);
    },
    enabled: !user && guestProjectFavoriteIds.length > 0,
  });

  // Combined favorite IDs
  const projectFavoriteIds = user ? dbProjectFavoriteIds : guestProjectFavoriteIds;

  const addProjectFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) {
        // Guest: update context (which syncs to sessionStorage)
        setGuestProjectFavoriteIds(current => {
          const filtered = current.filter(id => id !== projectId);
          return [projectId, ...filtered];
        });
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
        toast.success('Project saved to favorites');
      } else {
        queryClient.invalidateQueries({ queryKey: ['guest-project-favorites-data'] });
        toast.success('Project saved to favorites', {
          description: 'Saved to this browser only. Sign up free to keep across devices.',
          action: {
            label: 'Sign up',
            onClick: () => window.location.href = '/auth?tab=signup',
          },
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to save project: ' + (error as Error).message);
    },
  });

  const removeProjectFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) {
        // Guest: update context (which syncs to sessionStorage)
        setGuestProjectFavoriteIds(current => current.filter(id => id !== projectId));
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
