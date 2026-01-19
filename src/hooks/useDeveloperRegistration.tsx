import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DeveloperRegistrationData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  founded_year?: number;
  logo_url?: string;
}

export function useDeveloperRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: DeveloperRegistrationData) => {
      if (!user) throw new Error('Must be logged in');

      // Generate slug from name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Create developer profile
      const { data: developer, error: developerError } = await supabase
        .from('developers')
        .insert({
          user_id: user.id,
          name: data.name,
          slug,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          description: data.description || null,
          founded_year: data.founded_year || null,
          logo_url: data.logo_url || null,
          status: 'pending',
          verification_status: 'pending',
          is_verified: false,
          total_projects: 0,
        })
        .select()
        .single();

      if (developerError) throw developerError;

      // Add developer role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'developer',
        });

      if (roleError) {
        // If role already exists, that's okay
        if (!roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }

      return developer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['developerProfile'] });
      // Success handled by the dialog
    },
    onError: (error) => {
      toast.error('Failed to register: ' + error.message);
    },
  });
}
