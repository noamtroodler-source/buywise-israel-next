import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AgentRegistrationData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  license_number?: string;
  agency_id?: string;
  agency_name?: string;
  years_experience?: number;
  languages?: string[];
  specializations?: string[];
}

export function useAgentRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: AgentRegistrationData) => {
      if (!user) throw new Error('Must be logged in');

      // Create agent profile
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          license_number: data.license_number,
          agency_id: data.agency_id || null,
          agency_name: data.agency_name,
          joined_via: data.agency_id ? 'invite_code' : null,
          years_experience: data.years_experience || 0,
          languages: data.languages || ['Hebrew', 'English'],
          specializations: data.specializations,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Add agent role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'agent',
        });

      if (roleError) {
        // If role already exists, that's okay
        if (!roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }

      return agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['agentProfile'] });
      toast.success('Successfully registered as an agent!');
    },
    onError: (error) => {
      toast.error('Failed to register: ' + error.message);
    },
  });
}
