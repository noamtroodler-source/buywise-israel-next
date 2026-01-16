import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DistrictPriceIndex {
  id: string;
  district_name: string;
  year: number;
  quarter: number | null;
  month: number | null;
  period_type: 'year' | 'quarter' | 'month';
  index_value: number;
  index_base_year: string;
  yoy_change_percent: number | null;
  qoq_change_percent: number | null;
}

export function useDistrictPriceIndex(
  districtName: string | null,
  periodType?: 'year' | 'quarter' | 'month'
) {
  return useQuery({
    queryKey: ['districtPriceIndex', districtName, periodType],
    queryFn: async () => {
      if (!districtName) return [];
      
      let query = supabase
        .from('district_price_index')
        .select('*')
        .eq('district_name', districtName)
        .order('year', { ascending: true })
        .order('quarter', { ascending: true, nullsFirst: true })
        .order('month', { ascending: true, nullsFirst: true });
      
      if (periodType) {
        query = query.eq('period_type', periodType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DistrictPriceIndex[];
    },
    enabled: !!districtName,
  });
}

// Hook to get all districts' data for a specific period type
export function useAllDistrictsPriceIndex(periodType: 'year' | 'quarter' | 'month') {
  return useQuery({
    queryKey: ['allDistrictsPriceIndex', periodType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('district_price_index')
        .select('*')
        .eq('period_type', periodType)
        .order('district_name')
        .order('year', { ascending: true })
        .order('quarter', { ascending: true, nullsFirst: true });
      
      if (error) throw error;
      return (data || []) as DistrictPriceIndex[];
    },
  });
}
