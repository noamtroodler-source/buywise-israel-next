import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFilters } from '@/types/database';

export function useProperties(filters?: PropertyFilters) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      if (filters?.listing_status) {
        query = query.eq('listing_status', filters.listing_status);
      }
      if (filters?.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters?.min_bedrooms) {
        query = query.gte('bedrooms', filters.min_bedrooms);
      }
      if (filters?.max_bedrooms) {
        query = query.lte('bedrooms', filters.max_bedrooms);
      }
      if (filters?.min_size) {
        query = query.gte('size_sqm', filters.min_size);
      }
      if (filters?.max_size) {
        query = query.lte('size_sqm', filters.max_size);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Property[];
    },
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Property[];
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Property;
    },
    enabled: !!id,
  });
}