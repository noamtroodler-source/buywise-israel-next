import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { City } from '@/types/content';

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as City[];
    },
  });
}

export function useFeaturedCities() {
  return useQuery({
    queryKey: ['featuredCities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_featured', true)
        .order('name')
        .limit(6);

      if (error) throw error;
      return data as City[];
    },
  });
}

export function useCity(slug: string) {
  return useQuery({
    queryKey: ['city', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (!data) throw new Error('City not found');

      if (error) throw error;
      return data as City;
    },
    enabled: !!slug,
  });
}
