import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DeveloperProfile {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  founded_year: number | null;
  total_projects: number | null;
  is_verified: boolean | null;
  status: string | null;
  verification_status: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // New fields
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  office_address: string | null;
  office_city: string | null;
  company_size: string | null;
  company_type: string | null;
  specialties: string[] | null;
  email_verified_at: string | null;
  onboarding_completed_at: string | null;
  last_active_at: string | null;
}

export function useDeveloperProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['developerProfile', user?.id],
    queryFn: async (): Promise<DeveloperProfile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as DeveloperProfile | null;
    },
    enabled: !!user,
  });
}

export function useDeveloperById(id: string | undefined) {
  return useQuery({
    queryKey: ['developer', id],
    queryFn: async (): Promise<DeveloperProfile | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as DeveloperProfile;
    },
    enabled: !!id,
  });
}
