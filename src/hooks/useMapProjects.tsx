import { useCallback, useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/projects';
import type { PropertyFilters, MapBounds } from '@/types/database';

const PAGE_SIZE = 50; // projects are fewer, fetch more per page

interface UseMapProjectsOptions {
  enabled?: boolean;
}

interface MapProjectsResult {
  projects: Project[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
}

/**
 * Fetch published projects for the map view, with bounds + price filtering.
 * Designed to run alongside usePaginatedProperties.
 */
export function useMapProjects(
  filters?: PropertyFilters,
  options?: UseMapProjectsOptions,
): MapProjectsResult {
  const enabled = options?.enabled ?? true;
  const [page, setPage] = useState(1);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  const filterKey = JSON.stringify(filters);

  // Count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['map-projects', 'count', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);

      query = applyProjectFilters(query, filters);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  // Data
  const { data: pageData, isLoading, isFetching } = useQuery({
    queryKey: ['map-projects', 'data', filters, page],
    queryFn: async () => {
      const offset = (page - 1) * PAGE_SIZE;
      let query = supabase
        .from('projects')
        .select('*, developer:developer_id(*)')
        .eq('is_published', true);

      query = applyProjectFilters(query, filters);
      query = applyProjectSorting(query, filters);
      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const projects = page === 1
    ? (pageData ?? [])
    : [...allProjects.slice(0, (page - 1) * PAGE_SIZE), ...(pageData ?? [])];

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNextPage = page < totalPages;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setAllProjects(projects);
      setPage(prev => prev + 1);
    }
  }, [hasNextPage, isFetching, projects]);

  // Reset on filter change
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (filterKey !== prevFilterKeyRef.current) {
      prevFilterKeyRef.current = filterKey;
      setPage(1);
      setAllProjects([]);
    }
  }, [filterKey]);

  return { projects, totalCount, isLoading, isFetching, hasNextPage, loadMore };
}

function applyProjectFilters(query: any, filters?: PropertyFilters) {
  if (!filters) return query;

  if (filters.min_price) {
    query = query.gte('price_from', filters.min_price);
  }
  if (filters.max_price) {
    query = query.lte('price_from', filters.max_price);
  }

  if (filters.neighborhoods && filters.neighborhoods.length > 0) {
    query = query.in('neighborhood', filters.neighborhoods);
  }

  // Bounds filtering
  if (filters.bounds) {
    query = query
      .gte('latitude', filters.bounds.south)
      .lte('latitude', filters.bounds.north)
      .gte('longitude', filters.bounds.west)
      .lte('longitude', filters.bounds.east);
  }

  return query;
}

function applyProjectSorting(query: any, filters?: PropertyFilters) {
  if (!filters?.sort_by) {
    return query.order('created_at', { ascending: false });
  }
  switch (filters.sort_by) {
    case 'price_asc':
      return query.order('price_from', { ascending: true, nullsFirst: false });
    case 'price_desc':
      return query.order('price_from', { ascending: false });
    case 'newest':
    default:
      return query.order('created_at', { ascending: false });
  }
}
