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
      // If property_types filter is active, first get matching project IDs
      let propertyTypeProjectIds: string[] | null = null;
      if (filters?.property_types && filters.property_types.length > 0) {
        const { data: unitData } = await supabase
          .from('project_units')
          .select('project_id')
          .in('unit_type', filters.property_types);
        propertyTypeProjectIds = [...new Set((unitData || []).map(u => u.project_id))];
        if (propertyTypeProjectIds.length === 0) return 0;
      }

      let query = supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);

      if (propertyTypeProjectIds) {
        query = query.in('id', propertyTypeProjectIds);
      }

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
      if (filters?.completion_year_from) {
        query = query.gte('completion_date', `${filters.completion_year_from}-01-01`);
      }
      if (filters?.completion_year_to) {
        query = query.lte('completion_date', `${filters.completion_year_to}-12-31`);
      }
      if (filters?.developer_id) {
        query = query.eq('developer_id', filters.developer_id);
      }
      if (filters?.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities);
      }
      if (filters?.construction_stage) {
        query = query.eq('status', filters.construction_stage as any);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 10000,
  });
}

export function useDevelopers() {
  return useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('status', 'active')
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
        .eq('status', 'active')
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
      // First try to get from homepage_featured_slots (new system)
      const { data: slots } = await supabase
        .from('homepage_featured_slots')
        .select('entity_id, slot_type, position')
        .in('slot_type', ['project_hero', 'project_secondary'])
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('position', { ascending: true });

      let adminProjects: Project[] = [];
      const adminIds = new Set<string>();

      if (slots && slots.length > 0) {
        const projectIds = slots.map(s => s.entity_id);
        const { data, error } = await supabase
          .from('projects')
          .select(`*, developer:developer_id (*)`)
          .in('id', projectIds)
          .eq('is_published', true);

        if (error) throw error;
        
        const heroSlot = slots.find(s => s.slot_type === 'project_hero');
        const secondarySlots = slots.filter(s => s.slot_type === 'project_secondary')
          .sort((a, b) => a.position - b.position);
        
        const orderedIds = [
          heroSlot?.entity_id,
          ...secondarySlots.map(s => s.entity_id)
        ].filter(Boolean);
        
        adminProjects = orderedIds
          .map(id => data?.find(p => p.id === id))
          .filter(Boolean) as Project[];
        adminProjects.forEach(p => adminIds.add(p.id));
      } else {
        // Fallback to old is_featured system
        const { data, error } = await supabase
          .from('projects')
          .select(`*, developer:developer_id (*)`)
          .eq('is_published', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        adminProjects = (data ?? []) as Project[];
        adminProjects.forEach(p => adminIds.add(p.id));
      }

      // Merge featured projects from featured_listings
      const { data: featuredListings } = await supabase
        .from('featured_listings')
        .select('property_id')
        .eq('is_active', true);

      // featured_listings is for properties, not projects — skip merging for now
      // Projects use admin homepage_featured_slots only

      return adminProjects;
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
