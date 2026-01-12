import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CalculatorConstant {
  id: string;
  constant_key: string;
  category: string;
  value_numeric: number | null;
  value_json: Record<string, unknown> | null;
  label: string | null;
  description: string | null;
  source: string | null;
  source_url: string | null;
  effective_from: string | null;
  effective_until: string | null;
  is_current: boolean;
}

export function useCalculatorConstants(category?: string) {
  return useQuery({
    queryKey: ['calculator-constants', category],
    queryFn: async () => {
      let query = supabase
        .from('calculator_constants')
        .select('*')
        .eq('is_current', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('constant_key');

      if (error) throw error;
      return data as CalculatorConstant[];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour - these rarely change
  });
}

export function useConstant(key: string, fallback: number) {
  const { data } = useCalculatorConstants();
  
  const constant = data?.find(c => c.constant_key === key);
  return constant?.value_numeric ?? fallback;
}

export function useConstantJson<T = Record<string, unknown>>(key: string, fallback: T): T {
  const { data } = useCalculatorConstants();
  
  const constant = data?.find(c => c.constant_key === key);
  return (constant?.value_json as T) ?? fallback;
}

// Helper to get constant with source info for display
export function useConstantWithSource(key: string) {
  const { data } = useCalculatorConstants();
  
  const constant = data?.find(c => c.constant_key === key);
  return constant ? {
    value: constant.value_numeric,
    valueJson: constant.value_json,
    source: constant.source,
    sourceUrl: constant.source_url,
    effectiveFrom: constant.effective_from,
    label: constant.label,
    description: constant.description,
  } : null;
}

// Bulk fetch multiple constants at once
export function useConstants(keys: string[]) {
  const { data, isLoading, error } = useCalculatorConstants();
  
  const constants = keys.reduce((acc, key) => {
    const constant = data?.find(c => c.constant_key === key);
    acc[key] = constant?.value_numeric ?? null;
    return acc;
  }, {} as Record<string, number | null>);
  
  return { constants, isLoading, error };
}
