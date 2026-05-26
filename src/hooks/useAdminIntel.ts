import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IntelCategory } from './useIntel';
import { toast } from '@/hooks/use-toast';

export interface AdminIntelArticle {
  id: string;
  source_id: string | null;
  source_name: string;
  source_language: string;
  source_tier: number;
  headline: string;
  headline_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  translated_at: string | null;
  url: string;
  image_url: string | null;
  published_at: string;
  category: IntelCategory;
  category_confidence: number | null;
  auto_categorized: boolean | null;
  relevance_score: number;
  is_featured: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  is_duplicate: boolean | null;
  take_id: string | null;
  take_label: string | null;
  take_body: string | null;
  take_published_at: string | null;
  take_ai_drafted: boolean | null;
}

export interface AdminIntelFilters {
  search?: string;
  category?: IntelCategory | 'all';
  source?: string | 'all';
  hidden?: 'all' | 'visible' | 'hidden';
  hasTake?: 'all' | 'yes' | 'no';
  limit?: number;
}

export function useAdminIntelArticles(filters: AdminIntelFilters = {}) {
  const { search = '', category = 'all', source = 'all', hidden = 'visible', hasTake = 'all', limit = 100 } = filters;
  return useQuery({
    queryKey: ['admin-intel-articles', { search, category, source, hidden, hasTake, limit }],
    queryFn: async () => {
      let q = supabase.from('intel_feed_v').select('*');
      if (category !== 'all') q = q.eq('category', category);
      if (source !== 'all') q = q.eq('source_name', source);
      if (hidden === 'visible') q = q.eq('is_hidden', false);
      else if (hidden === 'hidden') q = q.eq('is_hidden', true);
      if (hasTake === 'yes') q = q.not('take_id', 'is', null);
      else if (hasTake === 'no') q = q.is('take_id', null);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`headline.ilike.${term},headline_en.ilike.${term}`);
      }
      q = q.order('is_pinned', { ascending: false }).order('published_at', { ascending: false }).limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AdminIntelArticle[];
    },
    staleTime: 30_000,
  });
}

export function useUpdateIntelArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<AdminIntelArticle, 'category' | 'relevance_score' | 'is_featured' | 'is_pinned' | 'is_hidden' | 'headline_en' | 'excerpt_en'>> }) => {
      const { error } = await supabase.from('intel_articles').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-intel-articles'] });
      qc.invalidateQueries({ queryKey: ['intel-feed'] });
      qc.invalidateQueries({ queryKey: ['intel-featured'] });
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });
}

export function useSaveIntelTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string | null; article_id: string; take_label: string; take_body: string; publish: boolean; ai_drafted?: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload: any = {
        article_id: input.article_id,
        take_label: input.take_label,
        take_body: input.take_body,
        published_at: input.publish ? new Date().toISOString() : null,
        created_by: userData.user?.id ?? null,
        ai_drafted: input.ai_drafted ?? false,
      };
      if (input.id) {
        const { error } = await supabase.from('intel_takes').update(payload).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('intel_takes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-intel-articles'] });
      qc.invalidateQueries({ queryKey: ['intel-feed'] });
      qc.invalidateQueries({ queryKey: ['intel-featured'] });
      toast({ title: 'BuyWise Take saved' });
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteIntelTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('intel_takes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-intel-articles'] });
      qc.invalidateQueries({ queryKey: ['intel-feed'] });
      toast({ title: 'Take removed' });
    },
  });
}

export function useDraftIntelTakeAI() {
  return useMutation({
    mutationFn: async (articleId: string): Promise<{ take_label: string; take_body: string }> => {
      const { data, error } = await supabase.functions.invoke('draft-intel-take', { body: { article_id: articleId } });
      if (error) throw error;
      if (!data?.draft) throw new Error('AI did not return a draft.');
      return data.draft;
    },
    onError: (e: any) => toast({ title: 'AI draft failed', description: e.message, variant: 'destructive' }),
  });
}

export function useEnrichIntelBacklog() {
  return useMutation({
    mutationFn: async (limit = 25) => {
      const { data, error } = await supabase.functions.invoke('enrich-intel-backlog', { body: { limit } });
      if (error) throw error;
      return data;
    },
    onError: (e: any) => toast({ title: 'Backfill failed', description: e.message, variant: 'destructive' }),
  });
}

// Sources
export interface AdminIntelSource {
  id: string;
  name: string;
  url: string;
  homepage_url: string | null;
  language: 'en' | 'he';
  tier: number;
  enabled: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
}

export function useAdminIntelSources() {
  return useQuery({
    queryKey: ['admin-intel-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intel_sources')
        .select('*')
        .order('tier', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AdminIntelSource[];
    },
  });
}

export interface IntelSourceHealthRow {
  id: string;
  name: string;
  url: string;
  homepage_url: string | null;
  language: string;
  tier: number;
  enabled: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
  hours_since_fetch: number | null;
  articles_last_7d: number | null;
  is_unhealthy: boolean | null;
}

export function useIntelSourceHealth() {
  return useQuery({
    queryKey: ['admin-intel-source-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intel_source_health_v')
        .select('*')
        .order('is_unhealthy', { ascending: false })
        .order('tier', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as IntelSourceHealthRow[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertIntelSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<AdminIntelSource> & { name: string; url: string; language: 'en' | 'he'; tier: number }) => {
      if (s.id) {
        const { error } = await supabase.from('intel_sources').update(s).eq('id', s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('intel_sources').insert(s as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-intel-sources'] });
      qc.invalidateQueries({ queryKey: ['admin-intel-source-health'] });
      qc.invalidateQueries({ queryKey: ['intel-sources-public'] });
      toast({ title: 'Source saved' });
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });
}

export function useTriggerIntelFetch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-intel-feeds', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['admin-intel-articles'] });
      qc.invalidateQueries({ queryKey: ['admin-intel-sources'] });
      qc.invalidateQueries({ queryKey: ['admin-intel-source-health'] });
      qc.invalidateQueries({ queryKey: ['intel-feed'] });
      toast({ title: 'Fetch complete', description: data?.summary ?? 'Feeds refreshed.' });
    },
    onError: (e: any) => toast({ title: 'Fetch failed', description: e.message, variant: 'destructive' }),
  });
}

export function useIntelSubscribers() {
  return useQuery({
    queryKey: ['admin-intel-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intel_brief_subscribers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}
