import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type IntelCategory =
  | 'property-market'
  | 'mortgage-rates'
  | 'tax-legal'
  | 'city-spotlight'
  | 'new-developments'
  | 'macro-economy'
  | 'aliyah-immigration'
  | 'policy-regulation'
  | 'general';

export interface IntelFeedItem {
  id: string;
  source_id: string | null;
  source_name: string;
  source_language: 'en' | 'he';
  source_tier: number;
  headline: string;
  excerpt: string | null;
  url: string;
  published_at: string;
  category: IntelCategory;
  relevance_score: number;
  is_featured: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  take_id: string | null;
  take_label: string | null;
  take_body: string | null;
  take_published_at: string | null;
}

export interface IntelFeedFilters {
  category?: IntelCategory | 'all';
  source?: string | 'all';
  sortBy?: 'recent' | 'relevance';
  hasTake?: boolean;
  search?: string;
  limit?: number;
}

export function useIntelFeed(filters: IntelFeedFilters = {}) {
  const {
    category = 'all',
    source = 'all',
    sortBy = 'recent',
    hasTake = false,
    search = '',
    limit = 60,
  } = filters;

  return useQuery({
    queryKey: ['intel-feed', { category, source, sortBy, hasTake, search, limit }],
    queryFn: async (): Promise<IntelFeedItem[]> => {
      let q = supabase.from('intel_feed_v').select('*').eq('is_hidden', false);

      if (category !== 'all') q = q.eq('category', category);
      if (source !== 'all') q = q.eq('source_name', source);
      if (hasTake) q = q.not('take_id', 'is', null);
      if (search.trim()) q = q.ilike('headline', `%${search.trim()}%`);

      if (sortBy === 'relevance') {
        q = q.order('is_pinned', { ascending: false })
             .order('relevance_score', { ascending: false })
             .order('published_at', { ascending: false });
      } else {
        q = q.order('is_pinned', { ascending: false })
             .order('published_at', { ascending: false });
      }

      const { data, error } = await q.limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as IntelFeedItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIntelFeatured() {
  return useQuery({
    queryKey: ['intel-featured'],
    queryFn: async (): Promise<IntelFeedItem | null> => {
      // Prefer explicitly featured + has a published take, then highest score
      const { data, error } = await supabase
        .from('intel_feed_v')
        .select('*')
        .eq('is_hidden', false)
        .or('is_featured.eq.true,relevance_score.eq.5')
        .order('is_featured', { ascending: false })
        .order('take_id', { ascending: false, nullsFirst: false })
        .order('published_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return ((data?.[0] ?? null) as unknown) as IntelFeedItem | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIntelSources() {
  return useQuery({
    queryKey: ['intel-sources-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intel_sources')
        .select('id,name,homepage_url,language,tier')
        .eq('enabled', true)
        .order('tier', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export async function subscribeToBrief(email: string) {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new Error('Please enter a valid email address.');
  }
  const { error } = await supabase
    .from('intel_brief_subscribers')
    .insert({ email: clean, source: 'intel-page' });
  if (error && !error.message.toLowerCase().includes('duplicate')) {
    throw error;
  }
}
