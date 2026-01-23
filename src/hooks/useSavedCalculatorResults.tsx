import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { getUserFriendlyError } from '@/utils/userFriendlyErrors';

export type CalculatorType = 'mortgage' | 'affordability' | 'truecost' | 'rentvsbuy' | 'investment';

export interface SavedCalculatorResult {
  id: string;
  user_id: string;
  calculator_type: CalculatorType;
  name: string | null;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useSavedCalculatorResults() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-calculator-results', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('saved_calculator_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedCalculatorResult[];
    },
    enabled: !!user,
  });
}

export function useSaveCalculatorResult() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calculatorType,
      name,
      inputs,
      results,
    }: {
      calculatorType: CalculatorType;
      name?: string;
      inputs: Record<string, unknown>;
      results: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Must be logged in to save results');

      const { data, error } = await supabase
        .from('saved_calculator_results')
        .insert([{
          user_id: user.id,
          calculator_type: calculatorType,
          name: name || null,
          inputs: inputs as Json,
          results: results as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-calculator-results'] });
      toast.success('Calculator results saved!');
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Failed to save your results. Please try again.'));
    },
  });
}

export function useDeleteCalculatorResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_calculator_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-calculator-results'] });
      toast.success('Saved result deleted');
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Failed to delete. Please try again.'));
    },
  });
}
