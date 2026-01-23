import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useProjectFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: projectFavoriteIds = [] } = useQuery({
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

  const addProjectFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('project_favorites')
        .insert({ 
          user_id: user.id, 
          project_id: projectId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['projectFavoriteIds'] });
      toast.success('Project saved to favorites');
    },
    onError: (error) => {
      toast.error('Failed to save project: ' + (error as Error).message);
    },
  });

  const removeProjectFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('project_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['projectFavoriteIds'] });
      toast.success('Project removed from favorites');
    },
    onError: (error) => {
      toast.error('Failed to remove project: ' + (error as Error).message);
    },
  });

  const toggleProjectFavorite = (projectId: string) => {
    if (projectFavoriteIds.includes(projectId)) {
      removeProjectFavorite.mutate(projectId);
    } else {
      addProjectFavorite.mutate(projectId);
    }
  };

  const isProjectFavorite = (projectId: string) => projectFavoriteIds.includes(projectId);

  return {
    projectFavorites,
    projectFavoriteIds,
    isLoading,
    addProjectFavorite: addProjectFavorite.mutate,
    removeProjectFavorite: removeProjectFavorite.mutate,
    toggleProjectFavorite,
    isProjectFavorite,
    isToggling: addProjectFavorite.isPending || removeProjectFavorite.isPending,
  };
}
