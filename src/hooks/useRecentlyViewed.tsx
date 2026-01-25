import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect, useState, useCallback } from 'react';
import { Property } from '@/types/database';

const STORAGE_KEY = 'buywise_recently_viewed';
const MAX_ITEMS = 20;

interface RecentlyViewedItem {
  property_id: string;
  viewed_at: string;
}

// Get from sessionStorage for guests (cleared when browser closes)
function getSessionStorage(): RecentlyViewedItem[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save to sessionStorage for guests
function setSessionStorage(items: RecentlyViewedItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Storage might be full or disabled
  }
}

export function useRecentlyViewed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [guestItems, setGuestItems] = useState<RecentlyViewedItem[]>([]);

  // Load guest items on mount
  useEffect(() => {
    if (!user) {
      setGuestItems(getSessionStorage());
    }
  }, [user]);

  // Query for logged-in users - fetch with property details
  const { data: dbRecentlyViewed = [], isLoading } = useQuery({
    queryKey: ['recently-viewed', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('recently_viewed')
        .select(`
          id,
          property_id,
          viewed_at,
          properties:property_id (
            *,
            agent:agent_id (*)
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(MAX_ITEMS);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get property IDs for guests
  const guestPropertyIds = guestItems.map(item => item.property_id);

  // Fetch guest properties
  const { data: guestProperties = [] } = useQuery({
    queryKey: ['recently-viewed-guest-properties', guestPropertyIds],
    queryFn: async () => {
      if (guestPropertyIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*, agent:agent_id (*)')
        .in('id', guestPropertyIds)
        .eq('is_published', true);

      if (error) throw error;
      
      // Sort by the order in guestItems
      const propertyMap = new Map(data?.map(p => [p.id, p]) || []);
      return guestPropertyIds
        .map(id => propertyMap.get(id))
        .filter(Boolean) as Property[];
    },
    enabled: !user && guestPropertyIds.length > 0,
  });

  // Add to recently viewed mutation
  const addMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) {
        // Guest: use sessionStorage (cleared when browser closes)
        const items = getSessionStorage();
        const filtered = items.filter(item => item.property_id !== propertyId);
        const newItems = [
          { property_id: propertyId, viewed_at: new Date().toISOString() },
          ...filtered,
        ].slice(0, MAX_ITEMS);
        setSessionStorage(newItems);
        setGuestItems(newItems);
        return;
      }

      // Logged in: upsert to database
      const { error } = await supabase
        .from('recently_viewed')
        .upsert({
          user_id: user.id,
          property_id: propertyId,
          viewed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,property_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['recently-viewed'] });
      }
    },
  });

  // Clear recently viewed
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        sessionStorage.removeItem(STORAGE_KEY);
        setGuestItems([]);
        return;
      }

      const { error } = await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['recently-viewed'] });
      }
    },
  });

  // Extract properties from DB results
  const recentProperties: Property[] = user
    ? dbRecentlyViewed
        .map((item: any) => item.properties)
        .filter(Boolean)
    : guestProperties;

  const recentPropertyIds = user
    ? dbRecentlyViewed.map((item: any) => item.property_id)
    : guestPropertyIds;

  const addToRecentlyViewed = useCallback((propertyId: string) => {
    addMutation.mutate(propertyId);
  }, [addMutation]);

  const clearRecentlyViewed = useCallback(() => {
    clearMutation.mutate();
  }, [clearMutation]);

  return {
    recentProperties,
    recentPropertyIds,
    isLoading: user ? isLoading : false,
    addToRecentlyViewed,
    clearRecentlyViewed,
  };
}
