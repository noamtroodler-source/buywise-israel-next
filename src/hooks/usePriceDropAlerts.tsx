import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PriceDropNotification {
  id: string;
  user_id: string;
  property_id: string;
  previous_price: number;
  new_price: number;
  drop_percent: number;
  is_read: boolean;
  created_at: string;
  property?: {
    id: string;
    title: string;
    city: string;
    images: string[] | null;
  } | null;
}

export function usePriceDropAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all price drop notifications for the user
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['priceDropNotifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('price_drop_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;
      if (!notificationsData || notificationsData.length === 0) return [];

      // Then get related properties
      const propertyIds = [...new Set(notificationsData.map(n => n.property_id))];
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, title, city, images')
        .in('id', propertyIds);

      const propertiesMap = new Map(propertiesData?.map(p => [p.id, p]) || []);

      return notificationsData.map(n => ({
        ...n,
        property: propertiesMap.get(n.property_id) || null
      })) as PriceDropNotification[];
    },
    enabled: !!user,
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('price_drop_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceDropNotifications'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('price_drop_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceDropNotifications'] });
      toast.success('All notifications marked as read');
    },
  });

  // Delete a notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('price_drop_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceDropNotifications'] });
    },
  });

  // Toggle price alert for a favorite
  const togglePriceAlert = useMutation({
    mutationFn: async ({ propertyId, enabled }: { propertyId: string; enabled: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('favorites')
        .update({ price_alert_enabled: enabled })
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(enabled ? 'Price alerts enabled' : 'Price alerts disabled');
    },
    onError: () => {
      toast.error('Failed to update alert settings');
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    togglePriceAlert: togglePriceAlert.mutate,
    isTogglingAlert: togglePriceAlert.isPending,
  };
}
