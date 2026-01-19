import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperProfile } from './useDeveloperProfile';

export interface DeveloperNotification {
  id: string;
  developer_id: string;
  type: 'inquiry' | 'project_approved' | 'project_rejected' | 'changes_requested' | 'system';
  title: string;
  message: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export function useDeveloperNotifications() {
  const { data: developer } = useDeveloperProfile();

  return useQuery({
    queryKey: ['developerNotifications', developer?.id],
    queryFn: async (): Promise<DeveloperNotification[]> => {
      if (!developer?.id) return [];

      const { data, error } = await supabase
        .from('developer_notifications')
        .select('*')
        .eq('developer_id', developer.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as DeveloperNotification[];
    },
    enabled: !!developer?.id,
  });
}

export function useDeveloperUnreadCount() {
  const { data: developer } = useDeveloperProfile();

  return useQuery({
    queryKey: ['developerNotificationsUnread', developer?.id],
    queryFn: async (): Promise<number> => {
      if (!developer?.id) return 0;

      const { count, error } = await supabase
        .from('developer_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', developer.id)
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!developer?.id,
  });
}

export function useMarkDeveloperNotificationRead() {
  const queryClient = useQueryClient();
  const { data: developer } = useDeveloperProfile();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('developer_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerNotifications', developer?.id] });
      queryClient.invalidateQueries({ queryKey: ['developerNotificationsUnread', developer?.id] });
    },
  });
}

export function useMarkAllDeveloperNotificationsRead() {
  const queryClient = useQueryClient();
  const { data: developer } = useDeveloperProfile();

  return useMutation({
    mutationFn: async () => {
      if (!developer?.id) return;

      const { error } = await supabase
        .from('developer_notifications')
        .update({ is_read: true })
        .eq('developer_id', developer.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerNotifications', developer?.id] });
      queryClient.invalidateQueries({ queryKey: ['developerNotificationsUnread', developer?.id] });
    },
  });
}
