import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Developer, Project, ProjectUnit } from '@/types/projects';

export function useDevelopers() {
  return useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
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
        .single();

      if (error) throw error;
      return data as Developer;
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
        .select(`*, developer:developer_id (*)`)
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
