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
      if (filters?.completion_year_from) {
        query = query.gte('completion_date', `${filters.completion_year_from}-01-01`);
      }
      if (filters?.completion_year_to) {
        query = query.lte('completion_date', `${filters.completion_year_to}-12-31`);
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

      // Merge boosted projects — query hero and secondary products separately
      const now = new Date().toISOString();
      const [{ data: heroProduct }, { data: secondaryProduct }] = await Promise.all([
        supabase.from('visibility_products').select('id').eq('slug', 'homepage_project_hero').eq('is_active', true).maybeSingle(),
        supabase.from('visibility_products').select('id').eq('slug', 'homepage_project_secondary').eq('is_active', true).maybeSingle(),
      ]);

      const [heroBoosts, secondaryBoosts] = await Promise.all([
        heroProduct
          ? supabase.from('active_boosts').select('target_id').eq('product_id', heroProduct.id).eq('target_type', 'project').eq('is_active', true).gt('ends_at', now)
          : Promise.resolve({ data: [] }),
        secondaryProduct
          ? supabase.from('active_boosts').select('target_id').eq('product_id', secondaryProduct.id).eq('target_type', 'project').eq('is_active', true).gt('ends_at', now)
          : Promise.resolve({ data: [] }),
      ]);

      const boostedHeroIds = ((heroBoosts.data ?? []).map(b => b.target_id)).filter(id => !adminIds.has(id));
      const boostedSecondaryIds = ((secondaryBoosts.data ?? []).map(b => b.target_id)).filter(id => !adminIds.has(id));
      const allBoostedIds = [...new Set([...boostedHeroIds, ...boostedSecondaryIds])];

      if (allBoostedIds.length > 0) {
        const { data: boostedData } = await supabase
          .from('projects')
          .select(`*, developer:developer_id (*)`)
          .in('id', allBoostedIds)
          .eq('is_published', true);

        const boostedMap = new Map((boostedData ?? []).map(p => [p.id, { ...p, _isBoosted: true }]));

        // hero-boosted projects fill slot 0, secondary fill slots 1-2, after admin slots
        const heroProjects = boostedHeroIds.map(id => boostedMap.get(id)).filter(Boolean) as Project[];
        const secondaryProjects = boostedSecondaryIds.map(id => boostedMap.get(id)).filter(Boolean) as Project[];

        adminProjects = [...adminProjects, ...heroProjects, ...secondaryProjects].slice(0, 8);
      }

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
