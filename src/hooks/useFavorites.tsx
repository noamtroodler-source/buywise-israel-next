import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Property } from '@/types/database';
import { useState, useEffect, useCallback } from 'react';
import { safeSessionGet, safeSessionSet, safeSessionRemove } from '@/utils/sessionStorage';

const GUEST_FAVORITES_KEY = 'buywise_guest_favorites';

interface GuestFavorite {
  property_id: string;
  price?: number;
}

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Guest favorites state (sessionStorage)
  const [guestFavorites, setGuestFavorites] = useState<GuestFavorite[]>([]);
  
  // Load guest favorites on mount
  useEffect(() => {
    if (!user) {
      setGuestFavorites(safeSessionGet<GuestFavorite[]>(GUEST_FAVORITES_KEY, []));
    }
  }, [user]);

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

  const { data: dbFavoriteIds = [] } = useQuery({
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

  // Guest property IDs
  const guestFavoriteIds = guestFavorites.map(f => f.property_id);
  
  // Fetch guest property details
  const { data: guestProperties = [] } = useQuery({
    queryKey: ['guest-favorite-properties', guestFavoriteIds],
    queryFn: async () => {
      if (guestFavoriteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*, agent:agent_id (*)')
        .in('id', guestFavoriteIds)
        .eq('is_published', true);

      if (error) throw error;
      
      // Sort by the order in guestFavorites
      const propertyMap = new Map(data?.map(p => [p.id, p]) || []);
      return guestFavoriteIds
        .map(id => propertyMap.get(id))
        .filter(Boolean) as Property[];
    },
    enabled: !user && guestFavoriteIds.length > 0,
  });

  // Combined favorite IDs
  const favoriteIds = user ? dbFavoriteIds : guestFavoriteIds;

  const addFavorite = useMutation({
    mutationFn: async ({ propertyId, currentPrice }: { propertyId: string; currentPrice?: number }) => {
      if (!user) {
        // Guest: use sessionStorage
        const current = safeSessionGet<GuestFavorite[]>(GUEST_FAVORITES_KEY, []);
        const filtered = current.filter(f => f.property_id !== propertyId);
        const updated = [{ property_id: propertyId, price: currentPrice }, ...filtered];
        safeSessionSet(GUEST_FAVORITES_KEY, updated);
        setGuestFavorites(updated);
        return;
      }
      
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
    onSuccess: (_, variables) => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['favoriteIds'] });
        toast.success('Property saved to favorites');
      } else {
        queryClient.invalidateQueries({ queryKey: ['guest-favorite-properties'] });
        toast.success('Property saved to favorites', {
          description: 'Saved to this browser only. Sign up free to keep across devices.',
          action: {
            label: 'Sign up',
            onClick: () => window.location.href = '/auth?tab=signup',
          },
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to save property: ' + (error as Error).message);
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) {
        // Guest: use sessionStorage
        const current = safeSessionGet<GuestFavorite[]>(GUEST_FAVORITES_KEY, []);
        const updated = current.filter(f => f.property_id !== propertyId);
        safeSessionSet(GUEST_FAVORITES_KEY, updated);
        setGuestFavorites(updated);
        return;
      }
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onMutate: async (propertyId) => {
      if (!user) return; // Guest updates are synchronous
      
      // Cancel any in-flight queries
      await queryClient.cancelQueries({ queryKey: ['favorites', user.id] });
      await queryClient.cancelQueries({ queryKey: ['favoriteIds', user.id] });
      
      // Snapshot current state for rollback
      const previousFavorites = queryClient.getQueryData(['favorites', user.id]);
      const previousIds = queryClient.getQueryData(['favoriteIds', user.id]);
      
      // Optimistically remove from cache
      queryClient.setQueryData(['favorites', user.id], (old: any[]) => 
        old?.filter(f => f.property_id !== propertyId) || []
      );
      queryClient.setQueryData(['favoriteIds', user.id], (old: string[]) =>
        old?.filter(id => id !== propertyId) || []
      );
      
      return { previousFavorites, previousIds };
    },
    onError: (error, propertyId, context) => {
      // Rollback on error for logged-in users
      if (user && context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user.id], context.previousFavorites);
      }
      if (user && context?.previousIds) {
        queryClient.setQueryData(['favoriteIds', user.id], context.previousIds);
      }
      toast.error('Failed to remove property');
    },
    onSuccess: () => {
      if (!user) {
        queryClient.invalidateQueries({ queryKey: ['guest-favorite-properties'] });
      }
      toast.success('Property removed from favorites');
    },
    onSettled: () => {
      if (user) {
        // Refetch to ensure sync with server
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['favoriteIds'] });
      }
    },
  });

  const toggleFavorite = useCallback((propertyId: string, currentPrice?: number) => {
    if (favoriteIds.includes(propertyId)) {
      removeFavorite.mutate(propertyId);
    } else {
      addFavorite.mutate({ propertyId, currentPrice });
    }
  }, [favoriteIds, addFavorite, removeFavorite]);

  const isFavorite = useCallback((propertyId: string) => favoriteIds.includes(propertyId), [favoriteIds]);

  // Extract properties from favorites for the favorites page
  const favoriteProperties: Property[] = user
    ? favorites.map((f: any) => f.properties).filter(Boolean)
    : guestProperties;

  return {
    favorites: user ? favorites : guestFavorites.map(f => ({ 
      property_id: f.property_id, 
      properties: guestProperties.find(p => p.id === f.property_id),
      price_alert_enabled: false,
    })),
    favoriteProperties,
    favoriteIds,
    isLoading: user ? isLoading : false,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    toggleFavorite,
    isFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
    isGuest: !user,
  };
}
