import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlossaryTerm {
  id: string;
  hebrew_term: string;
  english_term: string;
  transliteration: string | null;
  simple_explanation: string | null;
  detailed_explanation: string | null;
  usage_context: string | null;
  pro_tip: string | null;
  category: string | null;
  sort_order: number | null;
}

export function useGlossary(category?: string) {
  return useQuery({
    queryKey: ['glossary', category],
    queryFn: async () => {
      let query = supabase
        .from('glossary_terms')
        .select('*')
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GlossaryTerm[];
    },
  });
}

export function useGlossaryTerm(hebrewTerm: string) {
  return useQuery({
    queryKey: ['glossary-term', hebrewTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .eq('hebrew_term', hebrewTerm)
        .single();

      if (error) throw error;
      return data as GlossaryTerm;
    },
    enabled: !!hebrewTerm,
  });
}

export function useGlossarySearch(searchTerm: string) {
  return useQuery({
    queryKey: ['glossary-search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .or(`hebrew_term.ilike.%${searchTerm}%,english_term.ilike.%${searchTerm}%,transliteration.ilike.%${searchTerm}%`);

      if (error) throw error;
      return data as GlossaryTerm[];
    },
    enabled: searchTerm.length >= 2,
  });
}
