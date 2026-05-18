import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/userFriendlyErrors';

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
  confirm_claim_agent_id?: string;
  skip_match?: boolean;
}

export interface AgentRegistrationResult {
  status: 'created' | 'claimed' | 'existing' | 'needs_confirmation';
  agent?: any;
  match_tier?: string;
  candidate?: {
    id: string;
    name: string;
    license_number: string | null;
    listing_count: number;
  };
}

export function useAgentRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<AgentRegistrationResult, Error, AgentRegistrationData>({
    mutationFn: async (data) => {
      if (!user) throw new Error('Must be logged in');

      const { data: resp, error } = await supabase.functions.invoke('claim-or-create-agent', {
        body: {
          agency_id: data.agency_id || null,
          agency_name: data.agency_name || null,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          license_number: data.license_number || null,
          bio: data.bio || null,
          languages: data.languages,
          specializations: data.specializations,
          years_experience: data.years_experience ?? 0,
          confirm_claim_agent_id: data.confirm_claim_agent_id || null,
          skip_match: data.skip_match || false,
        },
      });

      if (error) throw error;
      if (resp?.error) throw new Error(resp.error);
      return resp as AgentRegistrationResult;
    },
    onSuccess: (result) => {
      if (result.status !== 'needs_confirmation') {
        queryClient.invalidateQueries({ queryKey: ['userRoles'] });
        queryClient.invalidateQueries({ queryKey: ['agentProfile'] });
      }
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Registration failed. Please try again.'));
    },
  });
}
