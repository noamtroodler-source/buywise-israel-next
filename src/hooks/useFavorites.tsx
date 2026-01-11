import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Property } from '@/types/database';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          property_id,
          created_at,
          price_alert_enabled,
          last_known_price,
          properties:property_id (
            *,
            agent:agent_id (*)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['favoriteIds', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(f => f.property_id) || [];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async ({ propertyId, currentPrice }: { propertyId: string; currentPrice?: number }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('favorites')
        .insert({ 
          user_id: user.id, 
          property_id: propertyId,
          last_known_price: currentPrice || null,
          price_alert_enabled: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteIds'] });
      toast.success('Property saved to favorites');
    },
    onError: () => {
      toast.error('Failed to save property');
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteIds'] });
      toast.success('Property removed from favorites');
    },
    onError: () => {
      toast.error('Failed to remove property');
    },
  });

  const toggleFavorite = (propertyId: string, currentPrice?: number) => {
    if (favoriteIds.includes(propertyId)) {
      removeFavorite.mutate(propertyId);
    } else {
      addFavorite.mutate({ propertyId, currentPrice });
    }
  };

  const isFavorite = (propertyId: string) => favoriteIds.includes(propertyId);

  // Extract properties from favorites for the favorites page
  const favoriteProperties: Property[] = favorites
    .map((f: any) => f.properties)
    .filter(Boolean);

  return {
    favorites,
    favoriteProperties,
    favoriteIds,
    isLoading,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    toggleFavorite,
    isFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
}
