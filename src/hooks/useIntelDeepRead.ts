import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DeepReadSubheads {
  context: string;
  what_changed: string;
  numbers: string;
  what_to_watch: string;
  caveats: string;
}

export interface IntelDeepReadItem {
  take_id: string;
  article_id: string;
  headline: string;
  headline_en: string | null;
  source_url: string;
  source_name: string;
  image_url: string | null;
  article_published_at: string;
  category: string;
  published_at: string;
  signal: string | null;
  why_you_care: string | null;
  our_move: string | null;
  deep_read_body: string | null;
  deep_read_subheads: DeepReadSubheads | null;
  take_label: string;
  ai_drafted: boolean;
  slug: string;
}

/** Live Deep Reads (status=published) — newest first, cap 5. */
export function useIntelDeepReads(limit = 5) {
  return useQuery({
    queryKey: ['intel-deep-reads-live', limit],
    queryFn: async (): Promise<IntelDeepReadItem[]> => {
      const { data, error } = await supabase
        .from('intel_deep_reads_v')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as IntelDeepReadItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIntelDeepReadBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['intel-deep-read', slug],
    enabled: !!slug,
    queryFn: async (): Promise<IntelDeepReadItem | null> => {
      const { data, error } = await supabase
        .from('intel_deep_reads_v')
        .select('*')
        .eq('slug', slug as string)
        .order('published_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return ((data?.[0] ?? null) as unknown) as IntelDeepReadItem | null;
    },
  });
}

// ---- Admin queue ----

export interface PendingDeepRead extends IntelDeepReadItem {
  status: 'pending_review' | 'published' | 'rejected' | 'draft';
  created_at: string;
}

export function useAdminPendingDeepReads() {
  return useQuery({
    queryKey: ['admin-pending-deep-reads'],
    queryFn: async () => {
      // Pull pending_review takes joined to articles
      const { data, error } = await supabase
        .from('intel_takes')
        .select(`
          id, article_id, take_label, signal, why_you_care, our_move,
          deep_read_body, deep_read_subheads, ai_drafted, status, created_at, published_at,
          rejected_reason,
          article:intel_articles!intel_takes_article_id_fkey(
            headline, headline_en, url, source_name, image_url, published_at, category
          )
        `)
        .eq('tier', 'deep_read')
        .in('status', ['pending_review', 'draft'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30_000,
  });
}

export function useUpdateDeepRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      take_label?: string;
      subheads: DeepReadSubheads;
      action: 'save_draft' | 'publish' | 'reject';
      rejected_reason?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const body = [
        input.subheads.context,
        input.subheads.what_changed,
        input.subheads.numbers,
        input.subheads.what_to_watch,
        input.subheads.caveats,
      ]
        .filter(Boolean)
        .join('\n\n');

      const patch: Record<string, unknown> = {
        deep_read_subheads: input.subheads,
        deep_read_body: body,
        reviewed_by: userData.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      };
      if (input.take_label) patch.take_label = input.take_label;
      if (input.action === 'publish') {
        patch.status = 'published';
        patch.published_at = new Date().toISOString();
      } else if (input.action === 'reject') {
        patch.status = 'rejected';
        patch.rejected_reason = input.rejected_reason ?? null;
      } else {
        patch.status = 'draft';
      }
      const { error } = await supabase.from('intel_takes').update(patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-pending-deep-reads'] });
      qc.invalidateQueries({ queryKey: ['intel-deep-reads-live'] });
      qc.invalidateQueries({ queryKey: ['intel-feed'] });
      qc.invalidateQueries({ queryKey: ['intel-featured'] });
      toast({
        title:
          vars.action === 'publish' ? 'Deep Read published'
          : vars.action === 'reject' ? 'Deep Read rejected'
          : 'Draft saved',
      });
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });
}
