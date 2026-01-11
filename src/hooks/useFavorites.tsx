import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Property } from '@/types/database';

export type FavoriteCategory = 'final_list' | 'considering' | 'ruled_out';

export interface FavoriteWithProperty {
  id: string;
  property_id: string;
  created_at: string;
  price_alert_enabled: boolean | null;
  last_known_price: number | null;
  category: FavoriteCategory;
  ruled_out_reason: string | null;
  sort_order: number | null;
  properties: Property | null;
}

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
          category,
          ruled_out_reason,
          sort_order,
          properties:property_id (
            *,
            agent:agent_id (*)
          )
        `)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as FavoriteWithProperty[];
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
          price_alert_enabled: true,
          category: 'considering' as FavoriteCategory
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

  const updateFavoriteCategory = useMutation({
    mutationFn: async ({ 
      propertyId, 
      category, 
      ruledOutReason 
    }: { 
      propertyId: string; 
      category: FavoriteCategory;
      ruledOutReason?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const updateData: { category: FavoriteCategory; ruled_out_reason?: string | null } = { category };
      
      if (category === 'ruled_out' && ruledOutReason) {
        updateData.ruled_out_reason = ruledOutReason;
      } else if (category !== 'ruled_out') {
        updateData.ruled_out_reason = null;
      }
      
      const { error } = await supabase
        .from('favorites')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });

  const updateRuledOutReason = useMutation({
    mutationFn: async ({ propertyId, reason }: { propertyId: string; reason: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('favorites')
        .update({ ruled_out_reason: reason })
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Note saved');
    },
    onError: () => {
      toast.error('Failed to save note');
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

  // Group favorites by category
  const favoritesByCategory = {
    final_list: favorites.filter(f => f.category === 'final_list'),
    considering: favorites.filter(f => f.category === 'considering' || !f.category),
    ruled_out: favorites.filter(f => f.category === 'ruled_out'),
  };

  // Extract properties from favorites for the favorites page
  const favoriteProperties: Property[] = favorites
    .map((f) => f.properties)
    .filter((p): p is Property => p !== null);

  return {
    favorites,
    favoriteProperties,
    favoritesByCategory,
    favoriteIds,
    isLoading,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    toggleFavorite,
    isFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
    updateFavoriteCategory: updateFavoriteCategory.mutate,
    updateRuledOutReason: updateRuledOutReason.mutate,
    isUpdatingCategory: updateFavoriteCategory.isPending,
  };
}
