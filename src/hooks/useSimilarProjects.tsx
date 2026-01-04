import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood?: string | null;
  price_from?: number | null;
  price_to?: number | null;
  images?: string[] | null;
  status?: string | null;
  completion_date?: string | null;
  developer_id?: string | null;
  available_units?: number | null;
  total_units?: number | null;
}

export function useSimilarProjects(currentProject: Project | null | undefined) {
  return useQuery({
    queryKey: ['similar-projects', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];

      // Find projects in the same city, excluding the current one
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_published', true)
        .eq('city', currentProject.city)
        .neq('id', currentProject.id)
        .limit(6);

      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!currentProject?.id,
  });
}
