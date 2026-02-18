import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AgentNotification {
  id: string;
  agent_id: string;
  type: 'lead' | 'listing' | 'system' | 'agency' | 'blog_reward';
  title: string;
  message: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export function useAgentNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-notifications', user?.id],
    queryFn: async () => {
      // First get the agent ID for this user
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!agent) return [];

      const { data, error } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AgentNotification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-notifications-unread-count', user?.id],
    queryFn: async () => {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!agent) return 0;

      const { count, error } = await supabase
        .from('agent_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('agent_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['agent-notifications-unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!agent) throw new Error('Agent not found');

      const { error } = await supabase
        .from('agent_notifications')
        .update({ is_read: true })
        .eq('agent_id', agent.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['agent-notifications-unread-count'] });
    },
  });
}
