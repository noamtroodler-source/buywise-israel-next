import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  years_experience: number;
  languages: string[];
  specializations: string[] | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (error) throw error;
      return data as Agent;
    },
    enabled: !!agentId,
  });
}

export function useAgentListings(agentId: string, status: 'active' | 'past') {
  return useQuery({
    queryKey: ['agent-listings', agentId, status],
    queryFn: async () => {
      const statusFilter = status === 'active' 
        ? ['for_sale', 'for_rent'] as const
        : ['sold', 'rented'] as const;
      
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

export function useAgentStats(agentId: string) {
  return useQuery({
    queryKey: ['agent-stats', agentId],
    queryFn: async () => {
      // Get all properties for this agent
      const { data: properties, error } = await supabase
        .from('properties')
        .select('price, listing_status, created_at')
        .eq('agent_id', agentId)
        .eq('is_published', true);
      
      if (error) throw error;
      
      const activeListings = properties?.filter(p => 
        p.listing_status === 'for_sale' || p.listing_status === 'for_rent'
      ) || [];
      
      const pastListings = properties?.filter(p => 
        p.listing_status === 'sold' || p.listing_status === 'rented'
      ) || [];
      
      // Calculate median price of active listings
      const activePrices = activeListings.map(p => p.price).sort((a, b) => a - b);
      const medianPrice = activePrices.length > 0 
        ? activePrices[Math.floor(activePrices.length / 2)] 
        : null;
      
      // Calculate average days on market (for sold listings, or active if none sold)
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
