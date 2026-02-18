import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyAgency } from './useAgencyManagement';

export interface AgencyNotification {
  id: string;
  agency_id: string;
  type: 'lead' | 'join_request' | 'team' | 'system' | 'blog_reward';
  title: string;
  message: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export function useAgencyNotifications() {
  const { data: agency } = useMyAgency();

  return useQuery({
    queryKey: ['agency-notifications', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];

      const { data, error } = await supabase
        .from('agency_notifications')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AgencyNotification[];
    },
    enabled: !!agency?.id,
    refetchInterval: 30000,
  });
}

export function useAgencyUnreadCount() {
  const { data: agency } = useMyAgency();

  return useQuery({
    queryKey: ['agency-notifications-unread-count', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return 0;

      const { count, error } = await supabase
        .from('agency_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agency.id)
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agency?.id,
    refetchInterval: 30000,
  });
}

export function useMarkAgencyNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('agency_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['agency-notifications-unread-count'] });
    },
  });
}

export function useMarkAllAgencyNotificationsRead() {
  const queryClient = useQueryClient();
  const { data: agency } = useMyAgency();

  return useMutation({
    mutationFn: async () => {
      if (!agency?.id) throw new Error('Agency not found');

      const { error } = await supabase
        .from('agency_notifications')
        .update({ is_read: true })
        .eq('agency_id', agency.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['agency-notifications-unread-count'] });
    },
  });
}
