import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateGuestId } from '@/utils/guestId';

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
  dedup_group_id: string | null;
  created_at: string;
  take_id: string | null;
  take_label: string | null;
  take_body: string | null;
  signal: string | null;
  why_you_care: string | null;
  our_move: string | null;
  take_published_at: string | null;
  take_ai_drafted: boolean | null;
  has_deep_read: boolean | null;
  deep_read_slug: string | null;
}

/** English headline if translated, otherwise the original. */
export function displayHeadline(a: Pick<IntelFeedItem, 'headline' | 'headline_en'>): string {
  return (a.headline_en && a.headline_en.trim()) || a.headline;
}

/** English excerpt if translated, otherwise the original (may be null). */
export function displayExcerpt(a: Pick<IntelFeedItem, 'excerpt' | 'excerpt_en'>): string | null {
  if (a.excerpt_en && a.excerpt_en.trim()) return a.excerpt_en;
  return a.excerpt ?? null;
}

/** True when the article is shown in English (either originally English, or translated). */
export function isDisplayedInEnglish(a: Pick<IntelFeedItem, 'source_language' | 'headline_en'>): boolean {
  return a.source_language === 'en' || !!a.headline_en;
}

/** True when the displayed headline came from a Hebrew source via translation. */
export function isTranslatedFromHebrew(a: Pick<IntelFeedItem, 'source_language' | 'headline_en'>): boolean {
  return a.source_language === 'he' && !!a.headline_en;
}

/** Fire-and-forget outbound click log. Never blocks navigation. */
export function trackIntelClick(article: Pick<IntelFeedItem, 'id'>) {
  try {
    const sessionId = getOrCreateGuestId();
    supabase
      .from('intel_article_clicks')
      .insert({
        article_id: article.id,
        session_id: sessionId,
        referrer_path: typeof window !== 'undefined' ? window.location.pathname : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      })
      .then(() => {});
  } catch {
    /* noop */
  }
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
      let q = supabase
        .from('intel_feed_v')
        .select('*')
        .eq('is_hidden', false)
        .or('is_duplicate.is.null,is_duplicate.eq.false');

      if (category !== 'all') q = q.eq('category', category);
      if (source !== 'all') q = q.eq('source_name', source);
      if (hasTake) q = q.not('take_id', 'is', null);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`headline.ilike.${term},headline_en.ilike.${term}`);
      }

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
      const { data, error } = await supabase
        .from('intel_feed_v')
        .select('*')
        .eq('is_hidden', false)
        .or('is_duplicate.is.null,is_duplicate.eq.false')
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
