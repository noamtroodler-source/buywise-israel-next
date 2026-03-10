import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgencyListing {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  currency: string | null;
  property_type: string;
  listing_status: string;
  verification_status: string;
  views_count: number | null;
  total_saves: number;
  images: string[] | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
  inquiries_count: number;
}

export function useAgencyListingsManagement(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyListingsManagement', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      // First get all agent IDs for this agency
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .eq('agency_id', agencyId);

      if (agentsError) throw agentsError;

      const agentIds = agents?.map(a => a.id) || [];

      if (agentIds.length === 0) return [];

      // Then get all properties for these agents
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          price,
          currency,
          property_type,
          listing_status,
          verification_status,
          views_count,
          images,
          agent_id,
          created_at,
          updated_at
        `)
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgencyListing[];
    },
    enabled: !!agencyId,
  });
}
