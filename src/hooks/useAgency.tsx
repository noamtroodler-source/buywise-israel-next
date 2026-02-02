import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  founded_year: number | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  is_verified: boolean;
  cities_covered: string[] | null;
  specializations: string[] | null;
  social_links?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyAgent {
  id: string;
  name: string;
  avatar_url: string | null;
  years_experience: number;
  languages: string[];
  is_verified: boolean;
  activeListingsCount?: number;
}

export function useAgency(slug: string) {
  return useQuery({
    queryKey: ['agency', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Agency;
    },
    enabled: !!slug,
  });
}

export function useAgencies() {
  return useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Agency[];
    },
  });
}

export function useAgencyAgents(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency-agents', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, name, avatar_url, years_experience, languages, is_verified')
        .eq('agency_id', agencyId);

      if (error) throw error;

      // Get active listings count for each agent
      const agentsWithCounts = await Promise.all(
        (agents || []).map(async (agent) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agent.id)
            .eq('is_published', true)
            .in('listing_status', ['for_sale', 'for_rent']);

          return {
            ...agent,
            activeListingsCount: count || 0,
          } as AgencyAgent;
        })
      );

      return agentsWithCounts;
    },
    enabled: !!agencyId,
  });
}

export function useAgencyListings(agencyId: string | undefined, status: 'active' | 'past') {
  return useQuery({
    queryKey: ['agency-listings', agencyId, status],
    queryFn: async () => {
      if (!agencyId) return [];

      // First get all agent IDs for this agency
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .eq('agency_id', agencyId);

      if (agentsError) throw agentsError;
      if (!agents || agents.length === 0) return [];

      const agentIds = agents.map((a) => a.id);

      // Then get properties for those agents
      const statusFilter = status === 'active' 
        ? ['for_sale', 'for_rent'] as const
        : ['sold', 'rented'] as const;

      const { data: properties, error } = await supabase
        .from('properties')
        .select('*, agent:agents(*)')
        .in('agent_id', agentIds)
        .eq('is_published', true)
        .in('listing_status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return properties || [];
    },
    enabled: !!agencyId,
  });
}

export function useAgencyStats(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency-stats', agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      // Get all agents for this agency
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .eq('agency_id', agencyId);

      if (agentsError) throw agentsError;
      if (!agents || agents.length === 0) {
        return {
          totalAgents: 0,
          activeListingsCount: 0,
          pastListingsCount: 0,
          medianPrice: null,
          avgDaysOnMarket: null,
        };
      }

      const agentIds = agents.map((a) => a.id);

      // Get active listings
      const { data: activeListings, error: activeError } = await supabase
        .from('properties')
        .select('price, created_at')
        .in('agent_id', agentIds)
        .eq('is_published', true)
        .in('listing_status', ['for_sale', 'for_rent'] as const);

      if (activeError) throw activeError;

      // Get past listings count
      const { count: pastCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .in('agent_id', agentIds)
        .eq('is_published', true)
        .in('listing_status', ['sold', 'rented'] as const);

      // Calculate median price
      let medianPrice = null;
      if (activeListings && activeListings.length > 0) {
        const prices = activeListings.map((p) => Number(p.price)).sort((a, b) => a - b);
        const mid = Math.floor(prices.length / 2);
        medianPrice = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
      }

      // Calculate average days on market
      let avgDaysOnMarket = null;
      if (activeListings && activeListings.length > 0) {
        const now = new Date();
        const totalDays = activeListings.reduce((sum, p) => {
          const created = new Date(p.created_at);
          const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgDaysOnMarket = Math.round(totalDays / activeListings.length);
      }

      return {
        totalAgents: agents.length,
        activeListingsCount: activeListings?.length || 0,
        pastListingsCount: pastCount || 0,
        medianPrice,
        avgDaysOnMarket,
      };
    },
    enabled: !!agencyId,
  });
}
