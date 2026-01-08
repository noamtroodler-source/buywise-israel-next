import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost, BlogCategory, BlogSortOption, BlogAudience } from '@/types/content';

export function useBlogCategories() {
  return useQuery({
    queryKey: ['blogCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogCategory[];
    },
  });
}

export function useBlogCities() {
  return useQuery({
    queryKey: ['blogCities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('city')
        .eq('is_published', true)
        .not('city', 'is', null);

      if (error) throw error;
      
      // Get unique cities
      const cities = [...new Set(data.map(post => post.city).filter(Boolean))] as string[];
      return cities.sort();
    },
  });
}

interface BlogPostsFilters {
  categorySlug?: string;
  city?: string;
  audiences?: BlogAudience[];
  search?: string;
  sortBy?: BlogSortOption;
}

export function useBlogPosts(filters: BlogPostsFilters = {}) {
  const { categorySlug, city, audiences = [], search, sortBy = 'newest' } = filters;

  return useQuery({
    queryKey: ['blogPosts', categorySlug, city, audiences, search, sortBy],
    queryFn: async () => {
      // First get saves count for each post
      const { data: savesData } = await supabase
        .from('saved_articles')
        .select('post_id');

      const savesCountMap = new Map<string, number>();
      savesData?.forEach(save => {
        const count = savesCountMap.get(save.post_id) || 0;
        savesCountMap.set(save.post_id, count + 1);
      });

      // Build the query
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:category_id (*)
        `)
        .eq('is_published', true);

      // Apply category filter
      if (categorySlug) {
        const { data: category } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();

        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      // Apply city filter
      if (city) {
        query = query.eq('city', city);
      }

      // Apply audience filter - check if any of the selected audiences are in the post's audiences array
      if (audiences.length > 0) {
        query = query.overlaps('audiences', audiences);
      }

      // Apply search filter
      if (search && search.trim()) {
        const searchTerm = search.trim();
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'most_viewed':
          query = query.order('views_count', { ascending: false });
          break;
        case 'most_saved':
          // We'll sort this client-side since saves_count isn't a column
          query = query.order('published_at', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
        default:
          query = query.order('published_at', { ascending: false, nullsFirst: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;

      // Add saves_count to each post
      let posts = (data || []).map(post => ({
        ...post,
        saves_count: savesCountMap.get(post.id) || 0,
      })) as BlogPost[];

      // Sort by saves_count if needed (client-side)
      if (sortBy === 'most_saved') {
        posts = posts.sort((a, b) => (b.saves_count || 0) - (a.saves_count || 0));
      }

      return posts;
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blogPost', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:category_id (*)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });
}

export function useRelatedPosts(categoryId: string | undefined, currentPostId: string | undefined, limit = 3) {
  return useQuery({
    queryKey: ['relatedPosts', categoryId, currentPostId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:category_id (*)
        `)
        .eq('is_published', true)
        .eq('category_id', categoryId!)
        .neq('id', currentPostId!)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!categoryId && !!currentPostId,
  });
}
