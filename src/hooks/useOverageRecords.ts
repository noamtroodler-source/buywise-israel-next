import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OverageRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  billing_period_start: string;
  billing_period_end: string;
  resource_type: string;
  plan_limit: number;
  actual_count: number;
  overage_units: number;
  rate_ils_per_unit: number;
  total_amount_ils: number;
  status: 'pending' | 'invoiced' | 'waived';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useOverageRecords(entityId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['overageRecords', entityId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('overage_records' as any)
        .select('*')
        .order('billing_period_start', { ascending: false })
        .limit(20);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as OverageRecord[];
    },
    enabled: !!user,
  });
}

export function useOverageRate(entityType: 'agency' | 'developer', resourceType: 'listing' | 'seat' | 'project') {
  return useQuery({
    queryKey: ['overageRate', entityType, resourceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('overage_rates' as any)
        .select('rate_ils')
        .eq('entity_type', entityType)
        .eq('resource_type', resourceType)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as { rate_ils: number } | null)?.rate_ils ?? null;
    },
  });
}
