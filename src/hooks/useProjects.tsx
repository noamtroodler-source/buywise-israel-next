import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Developer, Project, ProjectUnit } from '@/types/projects';
import { ProjectFiltersType } from '@/components/filters/ProjectFilters';

/**
 * Lightweight hook that only fetches the count of matching projects
 * Used for "Show X results" in filter Apply buttons
 */
export function useProjectCount(filters?: ProjectFiltersType) {
  return useQuery({
    queryKey: ['projects', 'count', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters?.min_price) {
        query = query.gte('price_from', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('price_from', filters.max_price);
      }
      if (filters?.completion_year) {
        // Filter projects completing in a specific year
        const startOfYear = `${filters.completion_year}-01-01`;
        const endOfYear = `${filters.completion_year}-12-31`;
        query = query.gte('completion_date', startOfYear).lte('completion_date', endOfYear);
      }
      if (filters?.developer_id) {
        query = query.eq('developer_id', filters.developer_id);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 10000, // Cache for 10s to avoid excessive queries
  });
}

export function useDevelopers() {
  return useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('status', 'approved')
        .eq('is_verified', true)
        .order('name');

      if (error) throw error;
      return data as Developer[];
    },
  });
}

export function useDeveloper(slug: string) {
  return useQuery({
    queryKey: ['developer', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;
      return data as Developer | null;
    },
    enabled: !!slug,
  });
}

export function useProjects(developerId?: string) {
  return useQuery({
    queryKey: ['projects', developerId],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`*, developer:developer_id (*)`)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (developerId) {
        query = query.eq('developer_id', developerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useFeaturedProjects() {
  return useQuery({
    queryKey: ['featuredProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, developer:developer_id (*)`)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *, 
          developer:developer_id (*),
          representing_agent:representing_agent_id (
            id, name, email, phone, avatar_url, agency_name, 
            is_verified, bio, languages, years_experience
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!slug,
  });
}

export function useProjectUnits(projectId: string) {
  return useQuery({
    queryKey: ['projectUnits', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_units')
        .select('*')
        .eq('project_id', projectId)
        .order('floor', { ascending: true });

      if (error) throw error;
      return data as ProjectUnit[];
    },
    enabled: !!projectId,
  });
}

export function useDeveloperProjects(developerId: string) {
  return useQuery({
    queryKey: ['developerProjects', developerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('developer_id', developerId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!developerId,
  });
}
