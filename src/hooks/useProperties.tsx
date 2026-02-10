import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFilters } from '@/types/database';

/**
 * Lightweight hook that only fetches the count of matching properties
 * Used for "Show X results" in filter Apply buttons
 */
export function usePropertyCount(filters?: PropertyFilters) {
  return useQuery({
    queryKey: ['properties', 'count', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.neighborhood) {
        query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
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
      if (filters?.min_floor !== undefined) {
        query = query.gte('floor', filters.min_floor);
      }
      if (filters?.max_floor !== undefined) {
        query = query.lte('floor', filters.max_floor);
      }
      if (filters?.min_lot_size) {
        query = query.gte('lot_size_sqm', filters.min_lot_size);
      }
      if (filters?.max_lot_size) {
        query = query.lte('lot_size_sqm', filters.max_lot_size);
      }
      if (filters?.min_year_built) {
        query = query.gte('year_built', filters.min_year_built);
      }
      if (filters?.max_year_built) {
        query = query.lte('year_built', filters.max_year_built);
      }
      if (filters?.max_days_listed) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.max_days_listed);
        query = query.gte('created_at', cutoffDate.toISOString());
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
      if (filters?.available_now) {
        const today = new Date().toISOString().split('T')[0];
        query = query.or(`entry_date.is.null,entry_date.lte.${today}`);
      }
      if (filters?.available_by) {
        query = query.or(`entry_date.is.null,entry_date.lte.${filters.available_by}`);
      }
      if (filters?.allows_pets && filters.allows_pets.length > 0) {
        const petFilters = [...filters.allows_pets];
        if (!petFilters.includes('all')) {
          petFilters.push('all');
        }
        query = query.in('allows_pets', petFilters);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 10000, // Cache for 10s to avoid excessive queries
  });
}

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
      if (filters?.neighborhood) {
        query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
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
      // Floor filter
      if (filters?.min_floor !== undefined) {
        query = query.gte('floor', filters.min_floor);
      }
      if (filters?.max_floor !== undefined) {
        query = query.lte('floor', filters.max_floor);
      }
      // Lot size filter (for houses/cottages)
      if (filters?.min_lot_size) {
        query = query.gte('lot_size_sqm', filters.min_lot_size);
      }
      if (filters?.max_lot_size) {
        query = query.lte('lot_size_sqm', filters.max_lot_size);
      }
      // Year built filter
      if (filters?.min_year_built) {
        query = query.gte('year_built', filters.min_year_built);
      }
      if (filters?.max_year_built) {
        query = query.lte('year_built', filters.max_year_built);
      }
      // Days on market filter (new listings)
      if (filters?.max_days_listed) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.max_days_listed);
        query = query.gte('created_at', cutoffDate.toISOString());
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
      
      // Rental-specific filters
      // Availability filter - use entry_date column
      if (filters?.available_now) {
        const today = new Date().toISOString().split('T')[0];
        query = query.or(`entry_date.is.null,entry_date.lte.${today}`);
      }
      if (filters?.available_by) {
        query = query.or(`entry_date.is.null,entry_date.lte.${filters.available_by}`);
      }
      // Pets allowed filter
      if (filters?.allows_pets && filters.allows_pets.length > 0) {
        // If specific pets selected, include those + 'all' (which allows all pets)
        const petFilters = [...filters.allows_pets];
        if (!petFilters.includes('all')) {
          petFilters.push('all');
        }
        query = query.in('allows_pets', petFilters);
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
          case 'price_drop':
            query = query.order('price_reduced_at', { ascending: false, nullsFirst: false });
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
        .maybeSingle();
      
      if (!data) throw new Error('Property not found');

      if (error) throw error;
      return data as Property;
    },
    enabled: !!id,
  });
}

interface FeaturedPropertiesOptions {
  enabled?: boolean;
}

export function useFeaturedSaleProperties(options?: FeaturedPropertiesOptions) {
  return useQuery({
    queryKey: ['properties', 'featured', 'for_sale'],
    queryFn: async () => {
      // First try to get from homepage_featured_slots (new system)
      const { data: slots } = await supabase
        .from('homepage_featured_slots')
        .select('entity_id, position')
        .eq('slot_type', 'property_sale')
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('position', { ascending: true })
        .limit(8);

      if (slots && slots.length > 0) {
        const propertyIds = slots.map(s => s.entity_id);
        const { data, error } = await supabase
          .from('properties')
          .select(`*, agent:agents(*)`)
          .in('id', propertyIds)
          .eq('is_published', true);

        if (error) throw error;
        
        // Sort by slot position
        const sortedData = propertyIds
          .map(id => data?.find(p => p.id === id))
          .filter(Boolean) as Property[];
        
        return sortedData;
      }

      // Fallback to old is_featured system
      const { data, error } = await supabase
        .from('properties')
        .select(`*, agent:agents(*)`)
        .eq('is_published', true)
        .eq('is_featured', true)
        .eq('listing_status', 'for_sale')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Property[];
    },
    enabled: options?.enabled !== false, // Default to true
  });
}

export function useFeaturedRentalProperties(options?: FeaturedPropertiesOptions) {
  return useQuery({
    queryKey: ['properties', 'featured', 'for_rent'],
    queryFn: async () => {
      // First try to get from homepage_featured_slots (new system)
      const { data: slots } = await supabase
        .from('homepage_featured_slots')
        .select('entity_id, position')
        .eq('slot_type', 'property_rent')
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('position', { ascending: true })
        .limit(8);

      if (slots && slots.length > 0) {
        const propertyIds = slots.map(s => s.entity_id);
        const { data, error } = await supabase
          .from('properties')
          .select(`*, agent:agents(*)`)
          .in('id', propertyIds)
          .eq('is_published', true);

        if (error) throw error;
        
        // Sort by slot position
        const sortedData = propertyIds
          .map(id => data?.find(p => p.id === id))
          .filter(Boolean) as Property[];
        
        return sortedData;
      }

      // Fallback to old is_featured system
      const { data, error } = await supabase
        .from('properties')
        .select(`*, agent:agents(*)`)
        .eq('is_published', true)
        .eq('is_featured', true)
        .eq('listing_status', 'for_rent')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Property[];
    },
    enabled: options?.enabled !== false, // Default to true
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