import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export type TeamActivityItem = {
  id: string;
  type: 'new_listing' | 'inquiry';
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
};

export function useAgencyTeamActivity(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyTeamActivity', agencyId],
    queryFn: async (): Promise<TeamActivityItem[]> => {
      if (!agencyId) return [];

      // Get agent IDs for this agency
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name')
        .eq('agency_id', agencyId);

      if (agentsError) throw agentsError;
      const agentMap = new Map((agents || []).map(a => [a.id, a.name]));
      const agentIds = [...agentMap.keys()];
      if (agentIds.length === 0) return [];

      // Fetch recent listings and inquiries in parallel
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [listingsRes, inquiriesRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id, title, agent_id, created_at')
          .in('agent_id', agentIds)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('property_inquiries')
          .select('id, name, property_id, agent_id, created_at')
          .in('agent_id', agentIds)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const items: TeamActivityItem[] = [];

      (listingsRes.data || []).forEach(p => {
        items.push({
          id: `listing-${p.id}`,
          type: 'new_listing',
          title: p.title || 'Untitled Listing',
          description: `Added by ${agentMap.get(p.agent_id!) || 'Unknown'}`,
          timestamp: p.created_at!,
          relativeTime: formatDistanceToNow(new Date(p.created_at!), { addSuffix: true }),
        });
      });

      (inquiriesRes.data || []).forEach(i => {
        items.push({
          id: `inquiry-${i.id}`,
          type: 'inquiry',
          title: `Inquiry from ${i.name || 'Unknown'}`,
          description: `For ${agentMap.get(i.agent_id) || 'an agent'}`,
          timestamp: i.created_at!,
          relativeTime: formatDistanceToNow(new Date(i.created_at!), { addSuffix: true }),
        });
      });

      // Sort by timestamp desc
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return items.slice(0, 10);
    },
    enabled: !!agencyId,
    refetchInterval: 60000,
  });
}
