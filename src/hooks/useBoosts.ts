import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';

export interface VisibilityProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  credit_cost: number;
  duration_days: number;
  max_slots: number | null;
  applies_to: string;
  is_active: boolean;
}

export interface ActiveBoost {
  id: string;
  entity_type: string;
  entity_id: string;
  product_id: string;
  target_type: string;
  target_id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

export function useVisibilityProducts(entityType?: 'agency' | 'developer') {
  return useQuery({
    queryKey: ['visibilityProducts', entityType],
    queryFn: async (): Promise<VisibilityProduct[]> => {
      let query = supabase
        .from('visibility_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Filter client-side for applies_to
      if (entityType) {
        return (data as VisibilityProduct[]).filter(
          (p) => p.applies_to === 'all' || p.applies_to === entityType
        );
      }
      return data as VisibilityProduct[];
    },
  });
}

export function useActiveBoosts(targetType?: string, targetId?: string) {
  const { data: sub } = useSubscription();

  return useQuery({
    queryKey: ['activeBoosts', sub?.entityType, sub?.entityId, targetType, targetId],
    queryFn: async (): Promise<ActiveBoost[]> => {
      if (!sub?.entityId) return [];

      let query = supabase
        .from('active_boosts')
        .select('*')
        .eq('entity_type', sub.entityType)
        .eq('entity_id', sub.entityId)
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (targetType) query = query.eq('target_type', targetType);
      if (targetId) query = query.eq('target_id', targetId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ActiveBoost[];
    },
    enabled: !!sub?.entityId,
  });
}

export function useActivateBoost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      product_slug: string;
      target_type: 'property' | 'project';
      target_id: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('activate-boost', {
        body: params,
      });

      if (error) throw new Error(error.message || 'Failed to activate boost');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBoosts'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Boost activated! Your listing is now promoted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate boost');
    },
  });
}
