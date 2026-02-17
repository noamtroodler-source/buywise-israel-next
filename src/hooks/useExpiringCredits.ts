import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExpiringCreditGroup {
  expiresAt: string;
  amount: number;
}

export function useExpiringCredits(entityType: string | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ['expiring-credits', entityType, entityId],
    queryFn: async (): Promise<ExpiringCreditGroup[]> => {
      if (!entityType || !entityId) return [];

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('expires_at, amount')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .not('expires_at', 'is', null)
        .gt('expires_at', new Date().toISOString())
        .gt('amount', 0);

      if (error) throw error;

      // Group by expires_at date
      const grouped = new Map<string, number>();
      for (const row of data || []) {
        const key = row.expires_at!;
        grouped.set(key, (grouped.get(key) || 0) + row.amount);
      }

      return Array.from(grouped.entries())
        .map(([expiresAt, amount]) => ({ expiresAt, amount }))
        .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    },
    enabled: !!entityType && !!entityId,
    staleTime: 60 * 1000,
  });
}
