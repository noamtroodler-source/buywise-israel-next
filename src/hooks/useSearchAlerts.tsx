import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { SearchAlert } from '@/types/database';

export function useSearchAlerts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['searchAlerts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('search_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SearchAlert[];
    },
    enabled: !!user,
  });
}

export function useDeleteSearchAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('search_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAlerts'] });
      toast.success('Alert deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete alert: ' + error.message);
    },
  });
}

export function useToggleSearchAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('search_alerts')
        .update({ is_active: isActive })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['searchAlerts'] });
      toast.success(isActive ? 'Alert activated' : 'Alert paused');
    },
    onError: (error: any) => {
      toast.error('Failed to update alert: ' + error.message);
    },
  });
}