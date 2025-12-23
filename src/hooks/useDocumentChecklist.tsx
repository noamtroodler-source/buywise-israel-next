import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentChecklistItem {
  id: string;
  document_name_english: string;
  document_name_hebrew: string | null;
  transliteration: string | null;
  stage: string;
  required_for: string[] | null;
  is_critical: boolean | null;
  where_to_get: string | null;
  typical_timeline: string | null;
  notes: string | null;
  sort_order: number | null;
}

export function useDocumentChecklist(stage?: string, buyerType?: string) {
  return useQuery({
    queryKey: ['document-checklist', stage, buyerType],
    queryFn: async () => {
      let query = supabase
        .from('document_checklist_items')
        .select('*')
        .order('stage')
        .order('sort_order', { ascending: true });

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query;
      if (error) throw error;

      let items = data as DocumentChecklistItem[];
      
      if (buyerType) {
        items = items.filter(item => 
          !item.required_for || item.required_for.includes(buyerType)
        );
      }

      return items;
    },
  });
}

export function useDocumentsByStage() {
  const { data, ...rest } = useDocumentChecklist();
  
  const groupedByStage = data?.reduce((acc, item) => {
    if (!acc[item.stage]) acc[item.stage] = [];
    acc[item.stage].push(item);
    return acc;
  }, {} as Record<string, DocumentChecklistItem[]>) || {};

  return { data: groupedByStage, ...rest };
}
