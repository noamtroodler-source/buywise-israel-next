import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFavorites } from './useFavorites';
import { useSearchAlerts } from './useSearchAlerts';
import { Property } from '@/types/database';
import { Database } from '@/integrations/supabase/types';

type PropertyType = Database['public']['Enums']['property_type'];

export function usePersonalizedProperties(excludePropertyId?: string) {
  const { user } = useAuth();
  const { favoriteProperties } = useFavorites();
  const { data: alerts } = useSearchAlerts();

  return useQuery({
    queryKey: ['personalizedProperties', user?.id, excludePropertyId],
    queryFn: async () => {
      if (!user) return [];

      // Extract preferences from favorites
      const favoriteCities = [...new Set(favoriteProperties.map(p => p.city))];
      const favoriteTypes = [...new Set(favoriteProperties.map(p => p.property_type))];
      const favoriteBedroomCounts = [...new Set(favoriteProperties.map(p => p.bedrooms).filter(Boolean))];
      
      // Extract preferences from search alerts
      const alertCities: string[] = [];
      const alertTypes: string[] = [];
      
      alerts?.forEach(alert => {
        const filters = alert.filters as Record<string, any>;
        if (filters?.cities) alertCities.push(...filters.cities);
        if (filters?.propertyTypes) alertTypes.push(...filters.propertyTypes);
      });

      // Combine preferences
      const cities = [...new Set([...favoriteCities, ...alertCities])];
      const propertyTypes = [...new Set([...favoriteTypes, ...alertTypes])] as PropertyType[];

      // Build query based on preferences
      let query = supabase
        .from('properties')
        .select('*, agent:agent_id (*)')
        .eq('is_published', true)
        .limit(12);

      if (excludePropertyId) {
        query = query.neq('id', excludePropertyId);
      }

      // Apply preference filters if we have any
      if (cities.length > 0) {
        query = query.in('city', cities);
      }
      
      if (propertyTypes.length > 0) {
        query = query.in('property_type', propertyTypes);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If no results with preferences, fall back to featured/recent
      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from('properties')
          .select('*, agent:agent_id (*)')
          .eq('is_published', true)
          .neq('id', excludePropertyId || '')
          .order('created_at', { ascending: false })
          .limit(12);
        
        return (fallbackData as Property[]) || [];
      }

      return data as Property[];
    },
    enabled: !!user,
  });
}
