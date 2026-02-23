import { useState, useCallback, useEffect, useRef } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFilters } from '@/types/database';

const DEFAULT_PAGE_SIZE = 24;

interface UsePaginatedPropertiesOptions {
  pageSize?: number;
}

interface PaginatedPropertiesResult {
  properties: Property[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  isFetching: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function usePaginatedProperties(
  filters?: PropertyFilters, 
  options?: UsePaginatedPropertiesOptions
): PaginatedPropertiesResult {
  const queryClient = useQueryClient();
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const [page, setPage] = useState(1);
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  // Reset when filters change
  const filterKey = JSON.stringify(filters);

  // First, get the total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['properties', 'paginated-count', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);

      // Commute filter: resolve qualifying cities first
      if (filters?.commute_destination && filters?.max_commute_minutes) {
        const column = filters.commute_destination === 'tel_aviv' ? 'commute_time_tel_aviv' : 'commute_time_jerusalem';
        const { data: cc } = await supabase.from('cities').select('name').not(column, 'is', null).lte(column, filters.max_commute_minutes);
        const cityNames = (cc ?? []).map(c => c.name);
        if (cityNames.length === 0) return 0;
        query = query.in('city', cityNames);
      }

      query = applyFilters(query, filters);

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch featured property IDs for search priority (page 1 only)
  const { data: boostedIds = [] } = useQuery({
    queryKey: ['properties', 'featured-ids'],
    queryFn: async () => {
      const { data: featured } = await supabase
        .from('featured_listings')
        .select('property_id')
        .eq('is_active', true);

      return (featured ?? []).map(f => f.property_id);
    },
    staleTime: 60_000,
  });

  // Fetch current page of properties
  const { data: pageData, isLoading, isFetching } = useQuery({
    queryKey: ['properties', 'paginated', filters, page, boostedIds],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      
      let query = supabase
        .from('properties')
        .select(`*, agent:agents(*, agency:agencies(id, name, logo_url))`)
        .eq('is_published', true);

      // Commute filter: resolve qualifying cities first
      if (filters?.commute_destination && filters?.max_commute_minutes) {
        const column = filters.commute_destination === 'tel_aviv' ? 'commute_time_tel_aviv' : 'commute_time_jerusalem';
        const { data: cc } = await supabase.from('cities').select('name').not(column, 'is', null).lte(column, filters.max_commute_minutes);
        const cityNames = (cc ?? []).map(c => c.name);
        if (cityNames.length === 0) return [] as Property[];
        query = query.in('city', cityNames);
      }

      // Exclude boosted IDs from organic results (page 1 only to avoid dupes)
      if (page === 1 && boostedIds.length > 0) {
        query = query.not('id', 'in', `(${boostedIds.join(',')})`);
      }

      query = applyFilters(query, filters);
      query = applySorting(query, filters);
      query = query.range(offset, offset + pageSize - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data as Property[];
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch boosted properties (only on page 1)
  const { data: boostedProperties = [] } = useQuery({
    queryKey: ['properties', 'search-boosted', boostedIds],
    queryFn: async () => {
      if (!boostedIds.length) return [] as Property[];
      const { data, error } = await supabase
        .from('properties')
        .select(`*, agent:agents(*, agency:agencies(id, name, logo_url))`)
        .in('id', boostedIds)
        .eq('is_published', true);
      if (error) return [] as Property[];
      return (data ?? []).map(p => ({ ...p, _isBoosted: true })) as Property[];
    },
    enabled: page === 1 && boostedIds.length > 0,
    staleTime: 60_000,
  });

  // Prepend boosted properties on page 1, accumulate on subsequent pages
  const organicProperties = page === 1 
    ? (pageData ?? []) 
    : [...allProperties.slice(0, (page - 1) * pageSize), ...(pageData ?? [])];
  
  const properties = page === 1 
    ? [...boostedProperties, ...organicProperties]
    : organicProperties;

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setAllProperties(properties);
      setPage(prev => prev + 1);
    }
  }, [hasNextPage, isFetching, properties]);

  const reset = useCallback(() => {
    setPage(1);
    setAllProperties([]);
    queryClient.invalidateQueries({ queryKey: ['properties', 'paginated', filters] });
  }, [queryClient, filters]);

  // Reset page when filters change
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (filterKey !== prevFilterKeyRef.current) {
      prevFilterKeyRef.current = filterKey;
      // Reset pagination, but do NOT clear existing results immediately.
      // The query uses `placeholderData: keepPreviousData`, so the UI stays stable
      // while the new filter/bounds query is fetching.
      setPage(1);
      setAllProperties([]);
    }
  }, [filterKey]);

  return {
    properties,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isFetching,
    loadMore,
    reset,
  };
}

// Helper function to apply filters to query
function applyFilters(query: any, filters?: PropertyFilters) {
  if (!filters) return query;

  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters.neighborhood) {
    query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
  }
  if (filters.property_types && filters.property_types.length > 0) {
    query = query.in('property_type', filters.property_types as any);
  } else if (filters.property_type) {
    query = query.eq('property_type', filters.property_type as any);
  }
  if (filters.listing_status) {
    query = query.eq('listing_status', filters.listing_status);
  }
  if (filters.min_price) {
    query = query.gte('price', filters.min_price);
  }
  if (filters.max_price) {
    query = query.lte('price', filters.max_price);
  }
  if (filters.min_rooms) {
    query = query.gte('bedrooms', filters.min_rooms);
  }
  if (filters.max_rooms) {
    query = query.lte('bedrooms', filters.max_rooms);
  }
  if (filters.min_bathrooms) {
    query = query.gte('bathrooms', filters.min_bathrooms);
  }
  if (filters.min_size) {
    query = query.gte('size_sqm', filters.min_size);
  }
  if (filters.max_size) {
    query = query.lte('size_sqm', filters.max_size);
  }
  if (filters.min_floor !== undefined) {
    query = query.gte('floor', filters.min_floor);
  }
  if (filters.max_floor !== undefined) {
    query = query.lte('floor', filters.max_floor);
  }
  if (filters.min_lot_size) {
    query = query.gte('lot_size_sqm', filters.min_lot_size);
  }
  if (filters.max_lot_size) {
    query = query.lte('lot_size_sqm', filters.max_lot_size);
  }
  if (filters.min_year_built) {
    query = query.gte('year_built', filters.min_year_built);
  }
  if (filters.max_year_built) {
    query = query.lte('year_built', filters.max_year_built);
  }
  if (filters.max_days_listed) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.max_days_listed);
    query = query.gte('created_at', cutoffDate.toISOString());
  }
  if (filters.min_parking) {
    query = query.gte('parking', filters.min_parking);
  }
  if (filters.is_furnished !== undefined) {
    query = query.eq('is_furnished', filters.is_furnished);
  }
  if (filters.is_accessible !== undefined) {
    query = query.eq('is_accessible', filters.is_accessible);
  }
  if (filters.condition && filters.condition.length > 0) {
    query = query.in('condition', filters.condition);
  }
  if (filters.features && filters.features.length > 0) {
    query = query.contains('features', filters.features);
  }
  if (filters.available_now) {
    const today = new Date().toISOString().split('T')[0];
    query = query.or(`entry_date.is.null,entry_date.lte.${today}`);
  }
  if (filters.available_by) {
    query = query.or(`entry_date.is.null,entry_date.lte.${filters.available_by}`);
  }
  if (filters.allows_pets && filters.allows_pets.length > 0) {
    const petFilters = [...filters.allows_pets];
    if (!petFilters.includes('all')) {
      petFilters.push('all');
    }
    query = query.in('allows_pets', petFilters);
  }
  
  // Map bounds filtering
  if (filters.bounds) {
    query = query
      .gte('latitude', filters.bounds.south)
      .lte('latitude', filters.bounds.north)
      .gte('longitude', filters.bounds.west)
      .lte('longitude', filters.bounds.east);
  }

  return query;
}

// Helper function to apply sorting
function applySorting(query: any, filters?: PropertyFilters) {
  if (!filters?.sort_by) {
    return query.order('created_at', { ascending: false });
  }

  switch (filters.sort_by) {
    case 'newest':
      return query.order('created_at', { ascending: false });
    case 'price_drop':
      return query
        .order('price_reduced_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    case 'price_asc':
      return query.order('price', { ascending: true });
    case 'price_desc':
      return query.order('price', { ascending: false });
    case 'size_desc':
      return query.order('size_sqm', { ascending: false, nullsFirst: false });
    case 'rooms_desc':
      return query.order('bedrooms', { ascending: false });
    default:
      return query.order('created_at', { ascending: false });
  }
}
