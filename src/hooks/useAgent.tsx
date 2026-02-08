import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentAgency {
  id: string;
  name: string;
  slug: string;
}

export interface Agent {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  license_number: string | null;
  agency_name: string | null;
  agency_id: string | null;
  agency: AgentAgency | null;
  years_experience: number;
  languages: string[];
  specializations: string[] | null;
  neighborhoods_covered: string[] | null;
  response_time_hours: number | null;
  is_verified: boolean;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*, agency:agencies(id, name, slug)')
        .eq('id', agentId)
        .single();
      
      if (error) throw error;
      return data as Agent;
    },
    enabled: !!agentId,
  });
}

export function useAgentListings(
  agentId: string, 
  status: 'active' | 'past',
  category: 'buy' | 'rent' = 'buy'
) {
  return useQuery({
    queryKey: ['agent-listings', agentId, status, category],
    queryFn: async () => {
      // Map category + status to listing_status values
      const statusFilter = category === 'buy'
        ? (status === 'active' ? ['for_sale'] as const : ['sold'] as const)
        : (status === 'active' ? ['for_rent'] as const : ['rented'] as const);
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .in('listing_status', statusFilter)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useAgentStats(agentId: string, category: 'buy' | 'rent' = 'buy') {
  return useQuery({
    queryKey: ['agent-stats', agentId, category],
    queryFn: async () => {
      const activeStatus = category === 'buy' ? 'for_sale' : 'for_rent';
      const pastStatus = category === 'buy' ? 'sold' : 'rented';
      
      // Get properties for this category only
      const { data: properties, error } = await supabase
        .from('properties')
        .select('price, listing_status, created_at')
        .eq('agent_id', agentId)
        .eq('is_published', true)
        .in('listing_status', [activeStatus, pastStatus]);
      
      if (error) throw error;
      
      const activeListings = properties?.filter(p => 
        p.listing_status === activeStatus
      ) || [];
      
      const pastListings = properties?.filter(p => 
        p.listing_status === pastStatus
      ) || [];
      
      // Calculate median price of active listings
      const activePrices = activeListings.map(p => p.price).sort((a, b) => a - b);
      const medianPrice = activePrices.length > 0 
        ? activePrices[Math.floor(activePrices.length / 2)] 
        : null;
      
      // Calculate average days on market (for sold/rented listings, or active if none)
      const listingsForDays = pastListings.length > 0 ? pastListings : activeListings;
      let avgDaysOnMarket: number | null = null;
      
      if (listingsForDays.length > 0) {
        const now = new Date();
        const totalDays = listingsForDays.reduce((sum, p) => {
          const created = new Date(p.created_at);
          const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgDaysOnMarket = Math.round(totalDays / listingsForDays.length);
      }
      
      return {
        activeListingsCount: activeListings.length,
        pastListingsCount: pastListings.length,
        medianPrice,
        avgDaysOnMarket,
      };
    },
    enabled: !!agentId,
  });
}
