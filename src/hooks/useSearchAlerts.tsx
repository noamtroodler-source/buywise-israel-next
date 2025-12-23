import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { SearchAlert, ListingType, AlertFrequency, PropertyFilters } from '@/types/database';

export interface CreateSearchAlertInput {
  name?: string;
  filters: PropertyFilters;
  listing_type: ListingType;
  frequency: AlertFrequency;
  notify_email: boolean;
  notify_whatsapp: boolean;
  notify_sms: boolean;
  phone?: string;
}

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

export function useCreateSearchAlert() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSearchAlertInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('search_alerts')
        .insert({
          user_id: user.id,
          name: input.name || null,
          filters: input.filters as any,
          listing_type: input.listing_type,
          frequency: input.frequency,
          notify_email: input.notify_email,
          notify_whatsapp: input.notify_whatsapp,
          notify_sms: input.notify_sms,
          phone: input.phone || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchAlerts'] });
      toast.success('Search alert created!');
    },
    onError: (error: any) => {
      toast.error('Failed to create alert: ' + error.message);
    },
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