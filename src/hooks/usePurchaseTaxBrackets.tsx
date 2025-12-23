import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PurchaseTaxBracket {
  id: string;
  buyer_type: string;
  bracket_min: number;
  bracket_max: number | null;
  rate_percent: number;
  is_current: boolean;
  effective_from: string;
  effective_until: string | null;
  notes: string | null;
}

export function usePurchaseTaxBrackets(buyerType?: string) {
  return useQuery({
    queryKey: ['purchase-tax-brackets', buyerType],
    queryFn: async () => {
      let query = supabase
        .from('purchase_tax_brackets')
        .select('*')
        .eq('is_current', true)
        .order('bracket_min', { ascending: true });

      if (buyerType) {
        query = query.eq('buyer_type', buyerType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PurchaseTaxBracket[];
    },
  });
}

export function useCurrentTaxBrackets() {
  return usePurchaseTaxBrackets();
}
