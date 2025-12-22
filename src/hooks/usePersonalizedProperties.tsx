import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFavorites } from './useFavorites';
import { Property } from '@/types/database';

export function usePersonalizedProperties(excludePropertyId?: string) {
  const { user } = useAuth();
  const { favoriteProperties } = useFavorites();

  return useQuery({
    queryKey: ['personalizedProperties', user?.id, excludePropertyId],
    queryFn: async (): Promise<Property[]> => {
      if (!user || favoriteProperties.length === 0) return [];

      // Get cities and price ranges from user's favorites
      const favoriteCities = [...new Set(favoriteProperties.map(p => p.city))];
      const prices = favoriteProperties.map(p => p.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const priceMin = avgPrice * 0.7;
      const priceMax = avgPrice * 1.3;

      // Fetch properties similar to user's favorites
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agent_id (*)
        `)
        .in('city', favoriteCities)
        .gte('price', priceMin)
        .lte('price', priceMax)
        .eq('is_published', true)
        .neq('id', excludePropertyId || '')
        .limit(8);

      if (error) throw error;

      // Filter out properties that are already in favorites
      const favoriteIds = favoriteProperties.map(p => p.id);
      const filtered = (data || []).filter(p => !favoriteIds.includes(p.id));

      return filtered as Property[];
    },
    enabled: !!user && favoriteProperties.length > 0,
  });
}
