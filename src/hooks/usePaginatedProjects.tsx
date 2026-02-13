import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/projects';
import { ProjectFiltersType } from '@/components/filters/ProjectFilters';

const DEFAULT_PAGE_SIZE = 24;

interface UsePaginatedProjectsOptions {
  pageSize?: number;
}

interface PaginatedProjectsResult {
  projects: Project[];
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

export function usePaginatedProjects(
  filters?: ProjectFiltersType,
  options?: UsePaginatedProjectsOptions
): PaginatedProjectsResult {
  const queryClient = useQueryClient();
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const [page, setPage] = useState(1);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Filter key for detecting changes
  const filterKey = JSON.stringify(filters);

  // Get total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['projects', 'paginated-count', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);

      query = applyFilters(query, filters);

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - projects don't change frequently
  });

  // Fetch current page
  const { data: pageData, isLoading, isFetching } = useQuery({
    queryKey: ['projects', 'paginated', filters, page],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('projects')
        .select(`*, developer:developer_id (*)`)
        .eq('is_published', true);

      query = applyFilters(query, filters);
      query = applySorting(query, filters);
      query = query.range(offset, offset + pageSize - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - projects don't change frequently
  });

  // Accumulate projects for infinite scroll
  const projects = useMemo(() => {
    if (page === 1) return pageData ?? [];
    return [...allProjects.slice(0, (page - 1) * pageSize), ...(pageData ?? [])];
  }, [page, pageData, allProjects, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setAllProjects(projects);
      setPage(prev => prev + 1);
    }
  }, [hasNextPage, isFetching, projects]);

  const reset = useCallback(() => {
    setPage(1);
    setAllProjects([]);
    queryClient.invalidateQueries({ queryKey: ['projects', 'paginated', filters] });
  }, [queryClient, filters]);

  // Reset page when filters change
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (filterKey !== prevFilterKeyRef.current) {
      prevFilterKeyRef.current = filterKey;
      setPage(1);
      setAllProjects([]);
    }
  }, [filterKey]);

  return {
    projects,
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

function applyFilters(query: any, filters?: ProjectFiltersType) {
  if (!filters) return query;

  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.status) {
    query = query.eq('status', filters.status as any);
  }
  if (filters.min_price) {
    query = query.gte('price_from', filters.min_price);
  }
  if (filters.max_price) {
    query = query.lte('price_from', filters.max_price);
  }
  if (filters.completion_year_from) {
    query = query.gte('completion_date', `${filters.completion_year_from}-01-01`);
  }
  if (filters.completion_year_to) {
    query = query.lte('completion_date', `${filters.completion_year_to}-12-31`);
  }
  if (filters.developer_id) {
    query = query.eq('developer_id', filters.developer_id);
  }

  return query;
}

function applySorting(query: any, filters?: ProjectFiltersType) {
  if (!filters?.sort_by) {
    return query.order('created_at', { ascending: false });
  }

  switch (filters.sort_by) {
    case 'price_asc':
      return query.order('price_from', { ascending: true, nullsFirst: false });
    case 'price_desc':
      return query.order('price_from', { ascending: false });
    case 'completion':
      return query.order('completion_date', { ascending: true, nullsFirst: false });
    case 'newest':
    default:
      return query.order('created_at', { ascending: false });
  }
}
