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
      if (filters?.property_types && filters.property_types.length > 0) {
        query = query.in('property_type', filters.property_types as any);
      } else if (filters?.property_type) {
        query = query.eq('property_type', filters.property_type as any);
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
      if (filters?.min_rooms) {
        query = query.gte('bedrooms', filters.min_rooms);
      }
      if (filters?.max_rooms) {
        query = query.lte('bedrooms', filters.max_rooms);
      }
      if (filters?.min_bathrooms) {
        query = query.gte('bathrooms', filters.min_bathrooms);
      }
      if (filters?.min_size) {
        query = query.gte('size_sqm', filters.min_size);
      }
      if (filters?.max_size) {
        query = query.lte('size_sqm', filters.max_size);
      }
      if (filters?.min_parking) {
        query = query.gte('parking', filters.min_parking);
      }
      if (filters?.is_furnished !== undefined) {
        query = query.eq('is_furnished', filters.is_furnished);
      }
      if (filters?.is_accessible !== undefined) {
        query = query.eq('is_accessible', filters.is_accessible);
      }
      if (filters?.condition && filters.condition.length > 0) {
        query = query.in('condition', filters.condition);
      }
      if (filters?.features && filters.features.length > 0) {
        query = query.contains('features', filters.features);
      }
      
      // Apply sorting
      if (filters?.sort_by) {
        switch (filters.sort_by) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'size_desc':
            query = query.order('size_sqm', { ascending: false, nullsFirst: false });
            break;
          case 'rooms_desc':
            query = query.order('bedrooms', { ascending: false });
            break;
        }
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

export function useFeaturedSaleProperties() {
  return useQuery({
    queryKey: ['properties', 'featured', 'for_sale'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .eq('listing_status', 'for_sale')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Property[];
    },
  });
}

export function useFeaturedRentalProperties() {
  return useQuery({
    queryKey: ['properties', 'featured', 'for_rent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .eq('listing_status', 'for_rent')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Property[];
    },
  });
}

export function useRecommendedProperties() {
  return useQuery({
    queryKey: ['properties', 'recommended'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('is_published', true)
        .order('views_count', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Property[];
    },
  });
}

export function useCityFeaturedProperties(cityName: string, limit: number = 8) {
  return useQuery({
    queryKey: ['properties', 'city-featured', cityName, limit],
    queryFn: async () => {
      // First try to get featured properties for this city
      const { data: featuredData, error: featuredError } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('is_published', true)
        .ilike('city', `%${cityName}%`)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (featuredError) throw featuredError;
      
      // If we have enough featured properties, return them
      if (featuredData && featuredData.length >= limit) {
        return featuredData as Property[];
      }

      // Otherwise, get additional non-featured properties to fill the gap
      const remaining = limit - (featuredData?.length || 0);
      const featuredIds = featuredData?.map(p => p.id) || [];
      
      let additionalQuery = supabase
        .from('properties')
        .select(`
          *,
          agent:agents(*)
        `)
        .eq('is_published', true)
        .ilike('city', `%${cityName}%`)
        .order('views_count', { ascending: false })
        .limit(remaining);
      
      if (featuredIds.length > 0) {
        additionalQuery = additionalQuery.not('id', 'in', `(${featuredIds.join(',')})`);
      }

      const { data: additionalData, error: additionalError } = await additionalQuery;

      if (additionalError) throw additionalError;

      return [...(featuredData || []), ...(additionalData || [])] as Property[];
    },
    enabled: !!cityName,
  });
}